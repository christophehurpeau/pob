import { describe, expect, test } from "vitest";
import type { PackageContext } from "./context.ts";
import { orderEffects } from "./effects.ts";
import { formatPlan, isPlanEmpty } from "./plan.ts";
import { defineStep } from "./step.ts";
import { createTestContext, runTestSteps } from "./testing.ts";

const files = {
  "package.json": '{\n  "name": "a"\n}\n',
  ".yo-rc.json": JSON.stringify({
    pob: { project: { type: "lib", packageManager: "yarn", ci: false } },
  }),
};

const fileStep = (
  name: string,
  writes: string[],
  run: (ctx: PackageContext) => void,
  overrides?: string[],
) => defineStep<PackageContext>({ name, writes, overrides, run });

describe("render strategies", () => {
  test("owned: written whatever the current content", async () => {
    const ctx = createTestContext({
      files: { ...files, ".editorconfig": "old\n" },
    });
    const plan = await runTestSteps(ctx, [
      fileStep("editorconfig", ["files:.editorconfig"], (c) => {
        c.output.owned(".editorconfig", "root = true\n");
      }),
    ]);
    expect(plan.files).toEqual([
      expect.objectContaining({
        path: ".editorconfig",
        op: "modify",
        before: "old\n",
        after: "root = true\n",
        strategy: "owned",
        owners: ["editorconfig"],
      }),
    ]);
  });

  test("seed: only created when absent", async () => {
    const step = fileStep("vite", ["files:vite.config.js"], (c) => {
      c.output.seed("vite.config.js", "export default {};\n");
    });
    const created = await runTestSteps(createTestContext({ files }), [step]);
    expect(created.files.map(({ op }) => op)).toEqual(["create"]);
    const kept = await runTestSteps(
      createTestContext({ files: { ...files, "vite.config.js": "mine\n" } }),
      [step],
    );
    expect(isPlanEmpty(kept)).toBe(true);
  });

  test("section: rendered from the current content", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: { ...files, "README.md": "# old\n\nbody\n" },
      }),
      [
        fileStep("readme", ["files:README.md"], (c) => {
          c.output.section(
            "README.md",
            (current) => `# a${current?.slice(current.indexOf("\n")) ?? ""}`,
          );
        }),
      ],
    );
    expect(plan.files[0]?.after).toBe("# a\n\nbody\n");
  });

  test("owned-if-pristine: rewritten only from a past output", async () => {
    const step = fileStep("lint", ["files:eslint.config.js"], (c) => {
      c.output.ownedIfPristine("eslint.config.js", "new\n", ["previous\n"], {
        warning: "eslint.config.js was edited by hand",
      });
    });
    const fromPrevious = await runTestSteps(
      createTestContext({
        files: { ...files, "eslint.config.js": "previous\n" },
      }),
      [step],
    );
    expect(fromPrevious.files[0]?.after).toBe("new\n");
    const edited = await runTestSteps(
      createTestContext({ files: { ...files, "eslint.config.js": "mine\n" } }),
      [step],
    );
    expect(edited.files).toEqual([]);
    expect(edited.warnings).toEqual(["eslint.config.js was edited by hand"]);
  });

  test("merged: keeps the keys no step writes, formatted once", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: {
          ...files,
          ".oxlintrc.json": '{"rules":{"no-console":"off"},"extends":[]}',
        },
      }),
      [
        defineStep<PackageContext>({
          name: "lint",
          writes: ["oxlintrc.extends", "files:.oxlintrc.json"],
          run: (c) => {
            const oxlintrc = c.model("oxlintrc", ".oxlintrc.json");
            oxlintrc.set("extends", ["base.json"]);
            c.output.merged(
              ".oxlintrc.json",
              oxlintrc,
              (model) => JSON.stringify(model.snapshot()),
              { format: "oxfmt" },
            );
          },
        }),
      ],
    );
    expect(plan.files[0]?.after).toBe(
      '{ "rules": { "no-console": "off" }, "extends": ["base.json"] }\n',
    );
  });

  test("removed: deletes files and directories, only when present", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: { ...files, ".eslintrc": "{}", "docs/index.html": "<html>" },
      }),
      [
        fileStep("legacy", ["files:*"], (c) => {
          c.output.removed(".eslintrc");
          c.output.removed("docs");
          c.output.removed(".travis.yml");
        }),
      ],
    );
    expect(
      plan.files.map(({ path, op, directory }) => ({ path, op, directory })),
    ).toEqual([
      { path: ".eslintrc", op: "delete", directory: undefined },
      { path: "docs", op: "delete", directory: true },
    ]);
  });

  test("two steps outputting a file differently is an error", async () => {
    const ctx = createTestContext({ files });
    await expect(
      runTestSteps(ctx, [
        fileStep("a", ["files:x"], (c) => {
          c.output.owned("x", "a");
        }),
        fileStep("b", ["files:x"], (c) => {
          c.output.owned("x", "b");
        }),
      ]),
    ).rejects.toThrow('step "b" outputs x differently than "a"');
  });

  test("overrides replaces the output of another step", async () => {
    const plan = await runTestSteps(createTestContext({ files }), [
      fileStep("a", ["files:x"], (c) => {
        c.output.owned("x", "a");
      }),
      fileStep(
        "b",
        ["files:x"],
        (c) => {
          c.output.removed("x");
        },
        ["a"],
      ),
      fileStep(
        "c",
        ["files:x"],
        (c) => {
          c.output.owned("x", "c");
        },
        ["b"],
      ),
    ]);
    expect(plan.files).toEqual([
      expect.objectContaining({ path: "x", after: "c", owners: ["c"] }),
    ]);
  });

  test("writing an undeclared file throws", async () => {
    await expect(
      runTestSteps(createTestContext({ files }), [
        fileStep("a", ["files:y"], (c) => {
          c.output.owned("x", "a");
        }),
      ]),
    ).rejects.toThrow('step "a" writes "files:x" without declaring it');
  });
});

describe("plan", () => {
  test("--check output lists diffs and effects", async () => {
    const ctx = createTestContext({ files: { ...files, a: "1\n2\n3\n" } });
    const plan = await runTestSteps(ctx, [
      fileStep("a", ["files:a"], (c) => {
        c.output.owned("a", "1\n2\nthree\n");
        c.effects.add({
          id: "install",
          reason: "dependencies changed",
          command: "yarn install",
          run: () => {},
        });
      }),
    ]);
    expect(formatPlan(plan)).toBe(`modify a (owned, a)
--- a/a
+++ b/a
@@ -1,3 +1,3 @@
 1
 2
-3
+three

effects:
  install: yarn install (dependencies changed)`);
  });

  test("effects run after the effects they declare", () => {
    expect(
      orderEffects([
        { id: "codemods", after: ["install"] },
        { id: "build", after: ["install", "missing"] },
        { id: "install" },
      ]).map(({ id }) => id),
    ).toEqual(["install", "codemods", "build"]);
  });
});

describe("output paths", () => {
  test.each(["../outside.txt", "a/../../outside.txt", "/etc/outside.txt"])(
    "%s, outside the package, is refused",
    async (filePath) => {
      const ctx = createTestContext({ files });
      await expect(
        runTestSteps(ctx, [
          fileStep("outside", ["files:**"], (c) => {
            c.output.removed(filePath);
          }),
        ]),
      ).rejects.toThrow(`outputs ${filePath}, outside the package`);
    },
  );

  test("normalized: a planned path is the path applied", async () => {
    const ctx = createTestContext({
      files: { ...files, "a/b.txt": "b\n" },
    });
    const plan = await runTestSteps(ctx, [
      fileStep("normalized", ["files:a/**"], (c) => {
        c.output.removed("./a/x/../b.txt");
      }),
    ]);
    expect(plan.files.map(({ path, op }) => `${op} ${path}`)).toEqual([
      "delete a/b.txt",
    ]);
  });
});
