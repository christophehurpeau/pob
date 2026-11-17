import { describe, expect, test } from "vitest";
import {
  createTestContext,
  plannedContent,
  runTestSteps,
} from "../../engine/testing.ts";
import { getRenovateExtends, renovateStep } from "./renovate.ts";
import {
  inMonorepoFacts,
  json,
  monorepoRootConfig,
  rootProject,
  yoRc,
} from "./testUtils.ts";

const presets = "github>christophehurpeau/renovate-presets";

describe("getRenovateExtends", () => {
  test("lib and app configs", () => {
    expect(
      getRenovateExtends({ app: false, pkgName: "lib", withExpo: false }),
    ).toEqual(["config:js-lib", presets]);
    expect(
      getRenovateExtends({ app: true, pkgName: "app", withExpo: false }),
    ).toEqual(["config:js-app", presets]);
  });

  test("does not extend the presets for pob-monorepo", () => {
    expect(
      getRenovateExtends({
        app: false,
        pkgName: "pob-monorepo",
        withExpo: false,
      }),
    ).toEqual(["config:js-lib"]);
  });

  test("extends the expo preset last", () => {
    expect(
      getRenovateExtends({ app: true, pkgName: "mobile", withExpo: true }),
    ).toEqual(["config:js-app", presets, `${presets}:expo`]);
  });
});

describe("renovate", () => {
  test("app: sets $schema and extends, keeps other keys", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: {
          ".yo-rc.json": yoRc({
            project: { ...rootProject, type: "app" },
            app: { type: "expo" },
            renovate: { enable: true },
          }),
          "package.json": json({ name: "app" }),
          "renovate.json": json({ extends: ["old"], rangeStrategy: "pin" }),
        },
      }),
      [renovateStep],
    );
    expect(JSON.parse(plannedContent(plan, "renovate.json") ?? "")).toEqual({
      extends: ["config:js-app", presets, `${presets}:expo`],
      rangeStrategy: "pin",
      $schema: "https://docs.renovatebot.com/renovate-schema.json",
    });
  });

  test("monorepo root with an expo package", async () => {
    const expoPackage = createTestContext({
      location: "packages/app",
      files: {
        ".yo-rc.json": yoRc({
          project: { type: "app" },
          app: { type: "expo" },
        }),
        "package.json": json({ name: "app" }),
      },
      facts: inMonorepoFacts,
      rootConfig: monorepoRootConfig,
    });
    const plan = await runTestSteps(
      createTestContext({
        files: {
          ".yo-rc.json": yoRc(monorepoRootConfig),
          "package.json": json({ name: "root", workspaces: ["packages/*"] }),
        },
        facts: { isMonorepoRoot: true },
        workspacePackages: [expoPackage],
      }),
      [renovateStep],
    );
    expect(JSON.parse(plannedContent(plan, "renovate.json") ?? "")).toEqual({
      extends: ["config:js-lib", presets, `${presets}:expo`],
    });
  });

  test("removed when disabled and in monorepo packages", async () => {
    const disabled = await runTestSteps(
      createTestContext({
        files: {
          ".yo-rc.json": yoRc({
            project: rootProject,
            lib: {},
            renovate: { enable: false },
          }),
          "package.json": json({ name: "lib" }),
          "renovate.json": "{}",
        },
      }),
      [renovateStep],
    );
    expect(disabled.files.map(({ op, path }) => `${op} ${path}`)).toEqual([
      "delete renovate.json",
    ]);

    const monorepoPackage = await runTestSteps(
      createTestContext({
        files: {
          ".yo-rc.json": yoRc({ project: { type: "lib" }, lib: {} }),
          "package.json": json({ name: "a" }),
          "renovate.json": "{}",
        },
        facts: inMonorepoFacts,
        rootConfig: monorepoRootConfig,
      }),
      [renovateStep],
    );
    expect(
      monorepoPackage.files.map(({ op, path }) => `${op} ${path}`),
    ).toEqual(["delete renovate.json"]);
  });

  test("throws without renovate config at the root", async () => {
    await expect(
      runTestSteps(
        createTestContext({
          files: {
            ".yo-rc.json": yoRc({ project: rootProject, lib: {} }),
            "package.json": json({ name: "lib" }),
          },
        }),
        [renovateStep],
      ),
    ).rejects.toThrow("missing pob config: renovate.enable");
  });
});
