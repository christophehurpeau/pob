import { describe, expect, test } from "vitest";
import {
  createTestContext,
  plannedContent,
  runTestSteps,
} from "../../engine/testing.ts";
import { packageStep } from "./package.ts";
import {
  author,
  inMonorepoFacts,
  json,
  monorepoRootPkg,
  plannedOp,
  plannedPkg,
  yoRc,
} from "./testUtils.ts";

const libYoRc = yoRc({
  project: { type: "lib", packageManager: "yarn", ci: true },
  lib: {},
});

describe("package", () => {
  test("standalone public lib: metadata and postinstall", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: {
          "package.json": json({
            name: "@scope/lib",
            type: "module",
            license: "MIT",
            author: "Test Author <test@example.com>",
            scripts: { prepare: "pob-root-postinstall", postinstallDev: "x" },
          }),
          ".yo-rc.json": libYoRc,
          "yarn-error.log": "",
        },
      }),
      [packageStep],
    );
    expect(plannedPkg(plan)).toEqual({
      name: "@scope/lib",
      version: "0.0.0",
      keywords: [],
      type: "module",
      license: "MIT",
      author: "Test Author <test@example.com>",
      publishConfig: { access: "public" },
      scripts: { postinstall: "pob-root-postinstall", postinstallDev: "x" },
    });
    expect(plannedOp(plan, "yarn-error.log")).toBe("delete");
  });

  test("private app with pnpm: prepare, type module, empty keys removed", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: {
          "package.json": json({
            name: "app",
            private: true,
            description: "",
            keywords: [],
            type: "commonjs",
            license: "MIT",
            author,
            packageManager: "pnpm@10.0.0",
            scripts: {
              postinstall: "pob-root-postinstall && echo installed",
            },
          }),
          ".yo-rc.json": yoRc({
            project: { type: "app", packageManager: "pnpm", ci: true },
            app: { type: "node" },
          }),
        },
      }),
      [packageStep],
    );
    expect(plannedPkg(plan)).toEqual({
      name: "app",
      private: true,
      type: "module",
      license: "MIT",
      author,
      packageManager: "pnpm@10.0.0",
      scripts: {
        // the leading space is kept from the yeoman generator
        postinstall: " echo installed",
        prepare: "pob-root-postinstall",
      },
    });
  });

  test("monorepo package: repository, homepage and bugs of the root git step, author, license and LICENSE", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: {
          "package.json": json({
            name: "@root/a",
            packageManager: "yarn@4.0.0",
            scripts: { postinstall: "pob-root-postinstall" },
          }),
          ".yo-rc.json": yoRc({ project: { type: "lib" }, lib: {} }),
          "yarn.lock": "",
          "pnpm-lock.yaml": "",
        },
        facts: inMonorepoFacts(),
        rootConfig: {
          project: { type: "lib", packageManager: "yarn", ci: true },
        },
      }),
      [packageStep],
    );
    expect(plannedPkg(plan)).toEqual({
      name: "@root/a",
      version: "0.0.0",
      keywords: [],
      type: "module",
      license: "MIT",
      author,
      // the origin remote wins over the repository of the root package.json,
      // like in the git step of the root
      homepage: "https://github.com/test/test",
      bugs: { url: "https://github.com/test/test/issues" },
      repository: {
        type: "git",
        url: "https://github.com/test/test.git",
        directory: "packages/a",
      },
      publishConfig: { access: "public" },
    });
    expect(plannedOp(plan, "yarn.lock")).toBe("delete");
    expect(plannedOp(plan, "pnpm-lock.yaml")).toBe("delete");
    expect(plannedContent(plan, "LICENSE")).toContain(
      `Copyright (c) ${new Date().getFullYear()} ${author}`,
    );
  });

  test("monorepo package: repository from the origin remote when the root has none, no bugs when private", async () => {
    const {
      repository: _r,
      homepage: _h,
      bugs: _b,
      ...rootPkg
    } = monorepoRootPkg;
    const plan = await runTestSteps(
      createTestContext({
        files: {
          "package.json": json({
            name: "a",
            private: true,
            type: "module",
            license: "MIT",
            author,
            bugs: "https://example.com",
          }),
          ".yo-rc.json": yoRc({ project: { type: "lib" }, lib: {} }),
        },
        facts: {
          ...inMonorepoFacts(rootPkg),
          originUrl: "git@github.com:acc/repo.git",
        },
      }),
      [packageStep],
    );
    const pkg = plannedPkg(plan);
    expect(pkg.repository).toEqual({
      type: "git",
      url: "https://github.com/acc/repo.git",
      directory: "packages/a",
    });
    expect(pkg.homepage).toBe("https://github.com/acc/repo");
    expect(pkg.bugs).toBeUndefined();
  });

  test("monorepo package: git+ root repository without homepage nor bugs, stale package values", async () => {
    const {
      repository: _r,
      homepage: _h,
      bugs: _b,
      ...rootPkg
    } = monorepoRootPkg;
    const plan = await runTestSteps(
      createTestContext({
        files: {
          "package.json": json({
            name: "a",
            type: "module",
            license: "MIT",
            author,
            homepage: "https://github.com/old/name",
            repository: {
              type: "git",
              url: "git+https://github.com/old/name.git",
              directory: "packages/a",
            },
          }),
          ".yo-rc.json": yoRc({ project: { type: "lib" }, lib: {} }),
        },
        facts: {
          ...inMonorepoFacts({
            ...rootPkg,
            repository: {
              type: "git",
              url: "git+https://github.com/acc/repo.git",
            },
          }),
          originUrl: undefined,
        },
      }),
      [packageStep],
    );
    const pkg = plannedPkg(plan);
    expect(pkg.repository).toEqual({
      type: "git",
      url: "https://github.com/acc/repo.git",
      directory: "packages/a",
    });
    expect(pkg.homepage).toBe("https://github.com/acc/repo");
    expect(pkg.bugs).toEqual({ url: "https://github.com/acc/repo/issues" });
  });

  test("monorepo package: values kept on an unknown git host", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: {
          "package.json": json({
            name: "a",
            type: "module",
            license: "MIT",
            author,
            homepage: "https://example.com",
          }),
          ".yo-rc.json": yoRc({ project: { type: "lib" }, lib: {} }),
        },
        facts: {
          ...inMonorepoFacts(),
          originUrl: "git@gitlab.mycorp.com:team/repo.git",
        },
      }),
      [packageStep],
    );
    const pkg = plannedPkg(plan);
    expect(pkg.repository).toBeUndefined();
    expect(pkg.homepage).toBe("https://example.com");
    expect(pkg.bugs).toBeUndefined();
  });

  test("monorepo root: -lerna renamed, prepare installed", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: {
          "package.json": json({
            name: "repo-lerna",
            private: true,
            type: "module",
            license: "MIT",
            author,
            workspaces: ["packages/*"],
          }),
          ".yo-rc.json": yoRc({
            project: { type: "lib", packageManager: "npm", ci: true },
            monorepo: {},
          }),
        },
        facts: { isMonorepoRoot: true },
      }),
      [packageStep],
    );
    const pkg = plannedPkg(plan);
    expect(pkg.name).toBe("repo-monorepo");
    expect(pkg.scripts).toEqual({ prepare: "pob-root-postinstall" });
  });

  test.each([
    [{ author: "Name" }, '"author" has no email'],
    [{ author, type: undefined }, '"type" is missing'],
    [{ author, license: undefined }, '"license" is missing'],
    [{ author, main: "./index.js", pob: {} }, '"exports" is missing'],
  ])("prompts are not ported: %o throws", async (pkg, message) => {
    const ctx = createTestContext({
      files: {
        "package.json": json({
          name: "lib",
          type: "module",
          license: "MIT",
          ...pkg,
        }),
        ".yo-rc.json": libYoRc,
      },
    });
    await expect(runTestSteps(ctx, [packageStep])).rejects.toThrow(message);
  });

  test("a script running more than pob-root-postinstall cannot be uninstalled", async () => {
    const ctx = createTestContext({
      files: {
        "package.json": json({
          name: "a",
          private: true,
          type: "module",
          license: "MIT",
          author,
          scripts: { postinstall: "echo && pob-root-postinstall" },
        }),
        ".yo-rc.json": yoRc({ project: { type: "lib" }, lib: {} }),
      },
      facts: inMonorepoFacts(),
    });
    await expect(runTestSteps(ctx, [packageStep])).rejects.toThrow(
      "Could not remove pob-root-postinstall",
    );
  });
});
