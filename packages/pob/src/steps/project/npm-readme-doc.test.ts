import { describe, expect, test } from "vitest";
import {
  createTestContext,
  plannedContent,
  runTestSteps,
} from "../../engine/testing.ts";
import { docStep } from "./doc.ts";
import { npmStep } from "./npm.ts";
import { readmeStep } from "./readme.ts";
import { json, plannedOp, plannedPkg, yoRc } from "./testUtils.ts";

const libYoRc = (lib: Record<string, unknown> = {}): string =>
  yoRc({ project: { type: "lib", packageManager: "yarn", ci: true }, lib });

describe("npm", () => {
  test("files from the directories, bin, skills, exports and extra entries", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: {
          "package.json": json({
            name: "lib",
            bin: { lib: "./bin/lib.js" },
            exports: {
              ".": "./dist/index.js",
              "./package.json": "./package.json",
              "./tsconfig": "./tsconfigs/base.json",
              "./config.js": "./config.js",
            },
            files: ["old", "!src/**/*.test.ts"],
            pob: {
              typescript: true,
              extraEntries: [{ directory: "extra" }],
            },
          }),
          ".yo-rc.json": libYoRc(),
          "skills/a.md": "",
        },
      }),
      [npmStep],
    );
    expect(plannedPkg(plan).files).toEqual([
      "src",
      "dist",
      "bin",
      "skills",
      "tsconfigs",
      "config.js",
      "extra",
      "!**/*.test.*",
      "!src/**/*.test.ts",
    ]);
    expect(plannedOp(plan, ".npmignore")).toBe("create");
  });

  test("private package: no files, no .npmignore", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: {
          "package.json": json({ name: "lib", private: true, files: ["lib"] }),
          ".yo-rc.json": libYoRc(),
          ".npmignore": "",
        },
      }),
      [npmStep],
    );
    expect(plannedPkg(plan).files).toBeUndefined();
    expect(plannedOp(plan, ".npmignore")).toBe("delete");
  });
});

describe("readme", () => {
  test("keeps the hand-written body, badges from the repository", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: {
          "package.json": json({
            name: "lib",
            description: "old",
            repository: "https://github.com/acc/lib.git",
          }),
          ".yo-rc.json": libYoRc({ testing: { codecov: true } }),
          "README.md": `<h1 align="center">
  lib
</h1>

<p align="center">
  old description
</p>

## Usage

Hand written.
`,
        },
      }),
      [readmeStep],
    );
    const readme = plannedContent(plan, "README.md") ?? "";
    expect(readme).toContain("  old\n");
    expect(readme).toContain("https://codecov.io/gh/acc/lib");
    expect(readme).toMatch(/<\/p>\n\n## Usage\n\nHand written.\n$/);
  });
});

describe("doc", () => {
  test("monorepo root: references and entry points of the packages", async () => {
    const workspacePackage = (
      location: string,
      pob: Record<string, unknown> = {},
    ): ReturnType<typeof createTestContext> =>
      createTestContext({
        location,
        facts: { isRoot: false },
        files: {
          "package.json": json({ name: location, pob }),
          ".yo-rc.json": yoRc({ project: { type: "lib" }, lib: {} }),
          "tsconfig.json": "{}",
        },
      });
    const withEntries = workspacePackage("packages/b", {
      entries: ["index", "x"],
    });
    const plan = await runTestSteps(
      createTestContext({
        files: {
          "package.json": json({ name: "root", workspaces: ["packages/*"] }),
          ".yo-rc.json": yoRc({
            project: { type: "lib", packageManager: "yarn", ci: true },
            monorepo: { documentation: true, typescript: true },
          }),
          "tsconfig.doc.json": '{ typedocOptions: { readme: "DOC.md" } }',
        },
        facts: { isMonorepoRoot: true },
        workspacePackages: [
          workspacePackage("packages/a"),
          withEntries,
          workspacePackage("packages/a-example"),
        ],
      }),
      [docStep],
    );
    const content = plannedContent(plan, "tsconfig.doc.json") ?? "";
    expect(content).toContain(
      '"references": [\n    { "path": "packages/a/tsconfig.json" },\n    { "path": "packages/b/tsconfig.json" }\n  ],',
    );
    expect(content).toContain(
      '"entryPoints": ["packages/b/src/index.ts", "packages/b/src/x.ts"]',
    );
    expect(content).toContain('"readme": "DOC.md"');
    expect(plannedPkg(plan).scripts).toEqual({
      "generate:api": "typedoc --tsconfig tsconfig.doc.json",
    });
  });

  test("disabled: tsconfig.doc.json, typedoc and script removed", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: {
          "package.json": json({
            name: "lib",
            scripts: { "generate:api": "typedoc" },
            devDependencies: { typedoc: "1.0.0" },
          }),
          ".yo-rc.json": libYoRc({ documentation: false }),
          "tsconfig.doc.json": "{}",
        },
      }),
      [docStep],
    );
    const pkg = plannedPkg(plan);
    expect(pkg.scripts).toBeUndefined();
    expect(pkg.devDependencies).toBeUndefined();
    expect(plannedOp(plan, "tsconfig.doc.json")).toBe("delete");
  });
});
