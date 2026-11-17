import { describe, expect, test } from "vitest";
import type { PackageContext } from "../../engine/context.ts";
import { defineStep } from "../../engine/step.ts";
import {
  createTestContext,
  plannedContent,
  runTestSteps,
} from "../../engine/testing.ts";
import { projectLegacyParts } from "./legacy.ts";
import { json, plannedOp, plannedPkg, yoRc } from "./testUtils.ts";

const projectLegacyStep = defineStep<PackageContext>({
  name: "legacy",
  writes: projectLegacyParts.flatMap((part) => part.writes),
  run: (ctx) => {
    for (const part of projectLegacyParts) part.run(ctx);
  },
});

describe("project legacy", () => {
  test("untranspiled lib: index.js moved, checks script and generated docs cleaned", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: {
          "package.json": json({
            name: "lib",
            scripts: {
              checks: "node scripts/check-packages.mjs && echo ok",
              "generate:docs": "jsdoc",
            },
            engines: { node: ">=22", yarn: "< 0.0.0" },
            devDependencies: { lerna: "1.0.0", jsdoc: "1.0.0" },
          }),
          ".yo-rc.json": yoRc({
            project: { type: "lib", packageManager: "yarn", ci: true },
            lib: {},
          }),
          "index.js": "export default 1;\n",
          "scripts/check-packages.mjs": "",
          "jsdoc.conf.js": "",
          "docs/.nojekyll": "",
          "docs/index.html": "",
        },
      }),
      [projectLegacyStep],
    );
    const pkg = plannedPkg(plan);
    expect(pkg.scripts).toEqual({ checks: "echo ok" });
    expect(pkg.engines).toEqual({ node: ">=22" });
    expect(pkg.devDependencies).toBeUndefined();
    expect(plannedContent(plan, "lib/index.js")).toBe("export default 1;\n");
    expect(plannedOp(plan, "index.js")).toBe("delete");
    expect(plannedOp(plan, "scripts/check-packages.mjs")).toBe("delete");
    expect(plannedOp(plan, "jsdoc.conf.js")).toBe("delete");
    expect(plannedOp(plan, "docs")).toBe("delete");
  });

  test("a hand-written docs directory is kept", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: {
          "package.json": json({ name: "app" }),
          ".yo-rc.json": yoRc({
            project: { type: "app", packageManager: "yarn", ci: true },
            app: { type: "node" },
          }),
          "docs/guide.md": "",
          "next-env.d.ts": "",
        },
      }),
      [projectLegacyStep],
    );
    expect(plannedOp(plan, "docs")).toBeUndefined();
    expect(plannedOp(plan, "next-env.d.ts")).toBe("delete");
  });
});
