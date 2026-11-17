import { describe, expect, test } from "vitest";
import type { PackageContext } from "../../engine/context.ts";
import { defineStep } from "../../engine/step.ts";
import { createTestContext, runTestSteps } from "../../engine/testing.ts";
import {
  monorepoPackageToolingStep,
  pobBaseLegacyPart,
  vscodeLegacyPart,
} from "./pobBase.ts";
import {
  inMonorepoFacts,
  json,
  monorepoRootConfig,
  rootProject,
  yoRc,
} from "./testUtils.ts";

const legacyStep = defineStep<PackageContext>({
  name: "legacy",
  writes: [...pobBaseLegacyPart.writes, ...vscodeLegacyPart.writes],
  run: (ctx) => {
    pobBaseLegacyPart.run(ctx);
    vscodeLegacyPart.run(ctx);
  },
});

const legacyPkg = {
  devDependencies: {
    "standard-version": "1.0.0",
    lerna: "1.0.0",
    husky: "1.0.0",
    "repository-check-dirty": "1.0.0",
    "@pob/root": "1.0.0",
    vitest: "1.0.0",
  },
  peerDependencies: { lerna: "*" },
  commitlint: {},
  husky: {},
  "lint-staged": {},
};

const createPackageContext = (name: string): PackageContext =>
  createTestContext({
    files: {
      ".yo-rc.json": yoRc({ project: { type: "lib" }, lib: {} }),
      "package.json": json({ name, ...legacyPkg }),
      Makefile: "",
      ".commitrc.js": "",
      ".git-hooks/pre-commit": "",
      "git-hooks/pre-push": "",
    },
    facts: inMonorepoFacts,
    rootConfig: monorepoRootConfig,
  });

describe("pob base cleanup", () => {
  test("monorepo package: root tooling, legacy files and git hooks", async () => {
    const ctx = createPackageContext("a");
    const plan = await runTestSteps(ctx, [
      legacyStep,
      monorepoPackageToolingStep,
    ]);
    expect(
      plan.files.map(({ op, path }) => `${op} ${path}`).toSorted(),
    ).toEqual([
      "delete .commitrc.js",
      "delete .git-hooks",
      "delete Makefile",
      "delete git-hooks",
      "modify package.json",
    ]);
    expect(ctx.pkg.snapshot()).toEqual({
      name: "a",
      devDependencies: { lerna: "1.0.0", vitest: "1.0.0" },
      peerDependencies: { lerna: "*" },
    });
  });

  test("the pob package keeps @pob/root", async () => {
    const ctx = createPackageContext("pob");
    await runTestSteps(ctx, [legacyStep, monorepoPackageToolingStep]);
    expect(ctx.pkg.get("devDependencies")).toEqual({
      lerna: "1.0.0",
      "@pob/root": "1.0.0",
      vitest: "1.0.0",
    });
  });

  test("root: only legacy files", async () => {
    const ctx = createTestContext({
      files: {
        ".yo-rc.json": yoRc({ project: rootProject, monorepo: {} }),
        "package.json": json({
          name: "@scope/root",
          workspaces: ["packages/*"],
          ...legacyPkg,
        }),
        Makefile: "",
        ".vscode/@scope-root.code-workspace": "{}",
      },
      facts: { isMonorepoRoot: true },
    });
    const plan = await runTestSteps(ctx, [
      legacyStep,
      monorepoPackageToolingStep,
    ]);
    expect(
      plan.files
        .filter((file) => file.path !== "package.json")
        .map(({ op, path }) => `${op} ${path}`)
        .toSorted(),
    ).toEqual(
      [".vscode/@scope-root.code-workspace", "Makefile"].map(
        (path) => `delete ${path}`,
      ),
    );
  });
});
