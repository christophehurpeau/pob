import { describe, expect, test } from "vitest";
import type { PobConfig } from "../../engine/config.ts";
import type { PackageContext } from "../../engine/context.ts";
import { defineStep } from "../../engine/step.ts";
import {
  createTestContext,
  plannedContent,
  runTestSteps,
} from "../../engine/testing.ts";
import { latestLTS, maintenanceLTS } from "../../utils/misc.ts";
import { ciStep } from "./ci.ts";
import {
  getCiNodeMajorVersions,
  getPushWorkflowRequiredChecks,
} from "./requiredChecks.ts";

const yoRc = (pob: unknown): string => JSON.stringify({ pob });

let publishedContexts: unknown;
const readContextsStep = defineStep<PackageContext>({
  name: "read-contexts",
  reads: ["ci.contexts"],
  run: (ctx) => {
    publishedContexts = ctx.model("ci").get("contexts");
  },
});

const runCi = async (
  files: Record<string, string>,
  options: {
    rootConfig?: PobConfig;
    inMonorepo?: boolean;
    isMonorepoRoot?: boolean;
  } = {},
) => {
  publishedContexts = undefined;
  const ctx = createTestContext({
    files,
    rootConfig: options.rootConfig,
    location: options.inMonorepo ? "packages/a" : ".",
    facts: options.inMonorepo
      ? {
          isRoot: false,
          inMonorepo: {
            rootDir: "/test",
            relative: "packages/a",
            rootPkg: {},
            rootConfig: options.rootConfig ?? { project: { type: "lib" } },
          },
        }
      : { isMonorepoRoot: !!options.isMonorepoRoot },
  });
  const plan = await runTestSteps(ctx, [ciStep, readContextsStep]);
  return {
    plan,
    contexts: publishedContexts,
    workflows: plan.files
      .filter(({ path }) => path.includes(".github/"))
      .map(({ path, op }) => `${op} ${path}`),
  };
};

const libFiles = (lib: unknown, pkg: unknown = { name: "lib" }) => ({
  "package.json": JSON.stringify(pkg),
  ".yo-rc.json": yoRc({
    project: { type: "lib", packageManager: "pnpm", ci: true },
    lib,
  }),
});

describe("ci", () => {
  test("lib with documentation: push and gh-pages workflows", async () => {
    const { plan, contexts } = await runCi(
      libFiles(
        { documentation: true, testing: { runner: "vitest" } },
        { name: "lib", scripts: { checks: "check-package-dependencies" } },
      ),
    );
    const push = plannedContent(plan, ".github/workflows/push.yml");
    expect(push).toContain("pnpm run checks");
    expect(push).toContain("pnpm run test");
    expect(plannedContent(plan, ".github/workflows/gh-pages.yml")).toContain(
      "publish_dir: ./generated-docs",
    );
    expect(contexts).toEqual([
      "reviewflow",
      `build (${maintenanceLTS}.x)`,
      `build (${latestLTS}.x)`,
    ]);
  });

  test("ci disabled: removes the workflows, publishes no context", async () => {
    const files = {
      ...libFiles({ testing: false }),
      ".yo-rc.json": yoRc({
        project: { type: "lib", packageManager: "pnpm", ci: false },
        lib: { testing: false },
      }),
      ".github/workflows/push.yml": "old",
      ".github/workflows/gh-pages.yml": "old",
    };
    const { workflows, contexts } = await runCi(files);
    expect(workflows).toEqual([
      "delete .github/workflows/push.yml",
      "delete .github/workflows/gh-pages.yml",
    ]);
    expect(contexts).toEqual([]);
  });

  test("monorepo package: never has workflows", async () => {
    const { workflows, contexts } = await runCi(
      {
        ...libFiles({ testing: {} }),
        ".github/workflows/push.yml": "old",
      },
      { inMonorepo: true },
    );
    expect(workflows).toEqual(["delete packages/a/.github/workflows/push.yml"]);
    expect(contexts).toEqual([]);
  });

  test("monorepo root with more than 8 packages: split jobs", async () => {
    const packages = Array.from({ length: 9 }, (_, index) =>
      createTestContext({
        location: `packages/p${index}`,
        facts: { isRoot: false },
        files: {
          "package.json": JSON.stringify({ name: `p${index}` }),
          ".yo-rc.json": yoRc({ project: { type: "lib" }, lib: {} }),
        },
      }),
    );
    publishedContexts = undefined;
    const ctx = createTestContext({
      files: {
        "package.json": JSON.stringify({
          name: "root",
          workspaces: ["packages/*"],
        }),
        ".yo-rc.json": yoRc({
          project: { type: "lib", packageManager: "yarn", ci: true },
          monorepo: {
            ci: true,
            testing: true,
            testRunner: "vitest",
            typescript: true,
            mongodbBinaryCacheKeyFile: "packages/p0/mongodb.json",
            e2eTesting: "packages/p0",
          },
        }),
      },
      facts: { isMonorepoRoot: true },
      workspacePackages: packages,
    });
    const plan = await runTestSteps(ctx, [ciStep, readContextsStep]);
    const push = plannedContent(plan, ".github/workflows/push.yml");
    expect(push).toContain("  lint:");
    expect(push?.slice(push.indexOf("  test-e2e:"))).toContain(
      "      - name: E2E testing prepare\n        run: yarn packages/p0 run test:e2e:prepare\n\n      - name: E2E testing\n",
    );
    expect(push).toContain("hashFiles('packages/p0/mongodb.json')");
    expect(push).toContain("yarn install --immutable\n");
    expect(publishedContexts).toEqual(
      getPushWorkflowRequiredChecks({
        splitJobs: true,
        checks: false,
        build: true,
        testing: true,
        nodeMajorVersions: getCiNodeMajorVersions(false),
      }),
    );
  });

  test("disablePushWorkflow at the monorepo root", async () => {
    const { workflows, contexts } = await runCi(
      {
        "package.json": JSON.stringify({ name: "root", workspaces: ["a/*"] }),
        ".yo-rc.json": yoRc({
          project: { type: "app", packageManager: "npm", ci: true },
          monorepo: { ci: true, disablePushWorkflow: true },
        }),
        ".github/workflows/push.yml": "old",
      },
      { isMonorepoRoot: true },
    );
    expect(workflows).toEqual(["delete .github/workflows/push.yml"]);
    expect(contexts).toEqual([]);
  });
});

describe("getPushWorkflowRequiredChecks", () => {
  test("only the latest LTS", () => {
    expect(
      getPushWorkflowRequiredChecks({
        splitJobs: false,
        checks: true,
        build: true,
        testing: true,
        nodeMajorVersions: getCiNodeMajorVersions(true),
      }),
    ).toEqual(["reviewflow", `build (${latestLTS}.x)`]);
  });

  test("split jobs", () => {
    expect(
      getPushWorkflowRequiredChecks({
        splitJobs: true,
        checks: true,
        build: false,
        testing: true,
        nodeMajorVersions: [maintenanceLTS, latestLTS],
      }),
    ).toEqual([
      "reviewflow",
      "checks",
      "lint",
      `test (${maintenanceLTS})`,
      `test (${latestLTS})`,
    ]);
  });
});
