import { describe, expect, test } from "vitest";
import type { PackageContext } from "./context.ts";
import { defineStep } from "./step.ts";
import { createTestContext, runTestSteps } from "./testing.ts";

const files = {
  "package.json": '{\n  "name": "a"\n}\n',
  ".yo-rc.json": JSON.stringify({
    pob: { project: { type: "lib", packageManager: "yarn", ci: false } },
  }),
};

const addDependency = defineStep<PackageContext>({
  name: "add-dependency",
  writes: ["pkg.dependencies"],
  run: (ctx) => {
    ctx.pkg.addDependencies(["vitest"]);
  },
});

const finalDevDependencies = async (
  steps: Parameters<typeof runTestSteps>[1],
): Promise<unknown> => {
  const ctx = createTestContext({ files });
  await runTestSteps(ctx, steps);
  return ctx.pkg.snapshot().devDependencies;
};

describe("reads implied by the dependency helpers", () => {
  test("a step writing devDependencies runs after the steps writing dependencies", async () => {
    const addDevDependency = defineStep<PackageContext>({
      name: "add-dev-dependency",
      writes: ["pkg.devDependencies"],
      run: (ctx) => {
        ctx.pkg.addDevDependencies(["vitest"]);
      },
    });
    expect(await finalDevDependencies([addDevDependency, addDependency])).toBe(
      undefined,
    );
    expect(await finalDevDependencies([addDependency, addDevDependency])).toBe(
      undefined,
    );
  });

  test("removing a devDependency reads the peerDependencies", async () => {
    const addPeer = defineStep<PackageContext>({
      name: "add-peer",
      writes: ["pkg.peerDependencies"],
      run: (ctx) => {
        ctx.pkg.set("peerDependencies", { react: "*" });
      },
    });
    const removeDev = defineStep<PackageContext>({
      name: "remove-dev",
      writes: ["pkg.devDependencies"],
      run: (ctx) => {
        ctx.pkg.removeDevDependencies(["react"]);
      },
    });
    const ctx = createTestContext({
      files: {
        ...files,
        "package.json": JSON.stringify({
          name: "a",
          devDependencies: { react: "19.0.0" },
        }),
      },
    });
    await runTestSteps(ctx, [removeDev, addPeer]);
    expect(ctx.pkg.snapshot().devDependencies).toEqual({ react: "19.0.0" });
  });
});

describe("reads covered only by the step's own writes", () => {
  const writeScript = defineStep<PackageContext>({
    name: "write-script",
    writes: ["pkg.scripts.build"],
    run: (ctx) => {
      ctx.pkg.set("scripts.build", "tsc");
    },
  });
  const readScript = defineStep<PackageContext>({
    name: "read-script",
    writes: ["pkg.scripts", "pkg.devDependencies"],
    run: (ctx) => {
      if (ctx.pkg.get("scripts.build")) ctx.pkg.set("devDependencies.x", "1");
    },
  });

  test.each([
    ["written before", [writeScript, readScript]],
    ["written after", [readScript, writeScript]],
  ])(
    "a value another step writes, %s, without ordering, is refused",
    async (_name, steps) => {
      await expect(finalDevDependencies(steps)).rejects.toThrow(
        'step "read-script" reads "pkg.scripts.build", which step "write-script" writes: declare it in its reads',
      );
    },
  );

  test("ordered by after, it is accepted", async () => {
    const readAfter = defineStep<PackageContext>({
      ...readScript,
      after: ["write-script"],
    });
    expect(await finalDevDependencies([readAfter, writeScript])).toEqual({
      x: "1",
    });
  });
});
