import { describe, expect, test } from "vitest";
import type { PobConfig } from "../../engine/config.ts";
import type { PackageContext } from "../../engine/context.ts";
import { defineStep } from "../../engine/step.ts";
import {
  createTestContext,
  plannedContent,
  runTestSteps,
} from "../../engine/testing.ts";
import { e2eStep } from "./e2e.ts";
import { testingLegacyPart } from "./legacy.ts";
import { testingStep } from "./testing.ts";

const yoRc = (pob: unknown): string => JSON.stringify({ pob });

const parse = (content: string | undefined): Record<string, unknown> =>
  JSON.parse(content ?? "{}") as Record<string, unknown>;

const libFiles = (
  lib: unknown,
  pkg: unknown = { name: "lib" },
  packageManager = "npm",
) => ({
  "package.json": JSON.stringify(pkg),
  ".yo-rc.json": yoRc({
    project: { type: "lib", packageManager, ci: true },
    lib,
  }),
});

const packageFacts = (rootConfig: PobConfig) => ({
  isRoot: false,
  inMonorepo: {
    rootDir: "/test",
    relative: "packages/a",
    rootPkg: { workspaces: ["packages/*"] },
    rootConfig,
  },
});

describe("testing", () => {
  test("node runner with a test folder", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: {
          ...libFiles({ testing: { runner: "node" } }),
          "test/index.js": "",
        },
      }),
      [testingStep],
    );
    expect(parse(plannedContent(plan, "package.json")).scripts).toMatchObject({
      test: "TZ=UTC node --test 'test/*.js'",
    });
  });

  test("testing disabled: removes scripts and test runners, keeps vitest for browser tests", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: {
          ...libFiles(
            { testing: false },
            {
              name: "lib",
              jest: {},
              scripts: { test: "vitest", "test:watch": "vitest --watch" },
              devDependencies: {
                "@vitest/browser-playwright": "1.0.0",
                "@vitest/coverage-v8": "1.0.0",
                jest: "1.0.0",
                vitest: "1.0.0",
              },
            },
          ),
          "jest.config.js": "",
        },
      }),
      [testingStep],
    );
    const pkg = parse(plannedContent(plan, "package.json"));
    expect(pkg.scripts).toBeUndefined();
    expect(pkg.jest).toBeUndefined();
    expect(pkg.devDependencies).toEqual({
      "@vitest/browser-playwright": "1.0.0",
      vite: "4.0.0",
      vitest: "6.0.0",
    });
    expect(plan.files.find(({ path }) => path === "jest.config.js")?.op).toBe(
      "delete",
    );
  });

  test("monorepo package with root testing: runs the root tests", async () => {
    const plan = await runTestSteps(
      createTestContext({
        location: "packages/a",
        files: {
          ...libFiles(
            { testing: {} },
            { name: "a", devDependencies: { vitest: "1.0.0" } },
          ),
          ".yo-rc.json": yoRc({
            project: { type: "lib" },
            lib: { testing: {} },
          }),
        },
        facts: packageFacts({
          project: { type: "lib", packageManager: "yarn" },
          monorepo: { testing: true, testRunner: "vitest" },
        }),
      }),
      [testingStep],
    );
    const pkg = parse(plannedContent(plan, "packages/a/package.json"));
    expect(pkg.scripts).toEqual({
      test: "yarn '../..' run test -- 'packages/a'",
    });
    expect(pkg.devDependencies).toBeUndefined();
  });

  test("bun runner requires bun", async () => {
    await expect(
      runTestSteps(
        createTestContext({
          files: libFiles({ testing: { runner: "bun" } }),
        }),
        [testingStep],
      ),
    ).rejects.toThrow("'bun' test runner cannot be set without bun");
  });

  test("bun runner", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: libFiles({ testing: { runner: "bun" } }, { name: "lib" }, "bun"),
      }),
      [testingStep],
    );
    expect(parse(plannedContent(plan, "package.json")).scripts).toEqual({
      test: "TZ=UTC bun test",
      "test:watch": "TZ=UTC bun test --watch",
      "test:coverage": "TZ=UTC bun test --coverage ",
      "test:coverage:generate":
        "TZ=UTC bun test --coverage --coverage-report=json",
    });
  });

  test("jest is refused", async () => {
    await expect(
      runTestSteps(
        createTestContext({ files: libFiles({ testing: { runner: "jest" } }) }),
        [testingStep],
      ),
    ).rejects.toThrow("Jest is deprecated");
  });

  test("legacy: removes the babel config generated for jest only", async () => {
    const run = async (babelConfig: string) =>
      runTestSteps(
        createTestContext({
          files: {
            ...libFiles(
              { testing: false },
              { name: "lib", devDependencies: { mocha: "1.0.0" } },
            ),
            "babel.config.cjs": babelConfig,
          },
        }),
        [
          defineStep<PackageContext>({
            name: "legacy",
            writes: testingLegacyPart.writes,
            run: testingLegacyPart.run,
          }),
        ],
      );
    const generated = await run(
      'module.exports = { presets: ["pob-babel/preset"] };',
    );
    expect(generated.files.map(({ path, op }) => `${op} ${path}`)).toEqual([
      "modify package.json",
      "delete babel.config.cjs",
    ]);
    const own = await run("module.exports = {};");
    expect(own.files.map(({ path }) => path)).toEqual(["package.json"]);
  });
});

describe("e2e", () => {
  test("keeps the browsers installed by hand", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: libFiles(
          { e2e: true },
          {
            name: "lib",
            scripts: { "test:e2e:prepare": "playwright install webkit" },
          },
        ),
      }),
      [e2eStep],
    );
    const pkg = parse(plannedContent(plan, "package.json"));
    expect(pkg.scripts).toEqual({
      "test:e2e": "playwright test -c e2e/playwright.config.ts",
      "test:e2e:prepare": "playwright install webkit",
    });
    expect(pkg.devDependencies).toEqual({
      "@playwright/test": "16.0.0",
      playwright: "10.0.0",
    });
  });

  test("disabled: keeps playwright for vitest browser tests", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: libFiles(
          { e2e: false },
          {
            name: "lib",
            scripts: { "test:e2e": "playwright test" },
            devDependencies: {
              "@playwright/test": "1.0.0",
              "@vitest/browser-playwright": "1.0.0",
            },
          },
        ),
      }),
      [e2eStep],
    );
    const pkg = parse(plannedContent(plan, "package.json"));
    expect(pkg.scripts).toBeUndefined();
    expect(pkg.devDependencies).toEqual({
      "@vitest/browser-playwright": "1.0.0",
      playwright: "10.0.0",
    });
  });
});
