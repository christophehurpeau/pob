import path from "node:path";
import type { PackageContext } from "../../engine/context.ts";
import type { JsonObject } from "../../engine/model.ts";
import { defineStep } from "../../engine/step.ts";
import {
  packageManagerRunWithCwd,
  quoteArg,
} from "../../utils/packageManager.ts";
import { workspacesRun } from "../../utils/packageManagerWorkspaces.ts";
import { hasVitestBrowserPlaywright } from "../settings.ts";
import type { TestingOptions } from "./settings.ts";
import { getRootMonorepoConfig, getTestingOptions } from "./settings.ts";

interface TestCommandContext {
  options: TestingOptions;
  testRunner: string | undefined;
  workspacesPattern: string | undefined;
  hasTestFolder: boolean;
  hasTestSetup: boolean;
}

interface TestCommandOptions {
  coverage?: boolean | "generate";
  watch?: boolean;
}

const nodeTestCommand = (
  {
    options,
    workspacesPattern,
    hasTestFolder,
    hasTestSetup,
  }: TestCommandContext,
  { coverage }: TestCommandOptions,
): string => {
  if (options.packageManager === "bun") {
    throw new Error(
      "'node' test runner is configured with the 'bun' package manager. Please set to 'bun' instead.",
    );
  }
  if (!workspacesPattern && options.monorepo) {
    throw new Error("Invalid workspacesPattern");
  }
  const workspacesPrefix =
    options.monorepo && workspacesPattern ? `${workspacesPattern}/*/` : "";
  const extension = options.typescript ? "ts" : "js";
  const coverageOptions = coverage
    ? ` --experimental-test-coverage${
        coverage === "generate"
          ? " --test-reporter=spec --test-reporter-destination=stdout --test-reporter=lcov --test-reporter-destination=generated-docs/coverage.lcov"
          : ""
      } --test-coverage-include="${workspacesPrefix}${options.srcDirectory}/**/*.${extension}"`
    : "";
  const testFiles = hasTestFolder
    ? "test/*"
    : `${options.srcDirectory}/**/*.test`;
  return `${coverage === "generate" ? "mkdir -p generated-docs && " : ""}TZ=UTC node ${
    hasTestSetup ? "--import ./src/test-setup.ts " : ""
  }--test${coverageOptions} '${workspacesPrefix}${testFiles}.${extension}'`;
};

const createTestCommand = (
  context: TestCommandContext,
  commandOptions: TestCommandOptions,
): string => {
  const { coverage, watch } = commandOptions;
  switch (context.testRunner) {
    case "node":
      return nodeTestCommand(context, commandOptions);
    case "bun": {
      if (context.options.packageManager !== "bun") {
        throw new Error(
          "'bun' test runner cannot be set without bun as packageManager.",
        );
      }
      return `TZ=UTC bun test${watch ? " --watch" : ""}${
        coverage
          ? ` --coverage ${coverage === "generate" ? "--coverage-report=json" : ""}`
          : ""
      }`;
    }
    case "vitest":
      return `TZ=UTC ${
        coverage
          ? `POB_VITEST_COVERAGE=json${coverage === "generate" ? "" : ",text"} `
          : ""
      }vitest${watch ? " --watch" : ""}${coverage ? " run --coverage" : ""}`;
    case undefined:
    default:
      throw new Error(`Invalid runner: "${String(context.testRunner)}"`);
  }
};

const testScripts = (context: TestCommandContext): Record<string, string> => ({
  test: createTestCommand(context, {}),
  "test:watch": createTestCommand(context, { watch: true }),
  "test:coverage": createTestCommand(context, { coverage: true }),
  "test:coverage:generate": createTestCommand(context, {
    coverage: "generate",
  }),
});

const getWorkspacesPattern = (workspaces: unknown): string => {
  const workspacesWithoutStar = (workspaces as string[]).map((workspace) => {
    if (!workspace.endsWith("/*")) {
      throw new Error(`Invalid workspace format: ${workspace}`);
    }
    return workspace.slice(0, -2);
  });
  return workspacesWithoutStar.length === 1
    ? (workspacesWithoutStar[0] ?? "")
    : `@(${workspacesWithoutStar.join("|")})`;
};

/** test scripts and test runner dependencies */
export const testingStep = defineStep<PackageContext>({
  name: "testing",
  reads: ["pkg.workspaces"],
  writes: [
    "pkg.devDependencies",
    "pkg.jest",
    "pkg.scripts.test",
    "pkg.scripts.test:watch",
    "pkg.scripts.test:coverage",
    "pkg.scripts.test:coverage:generate",
    "pkg.scripts.test:coverage:json",
    "pkg.scripts.test:coverage:lcov",
    "files:jest.config.*",
    "files:tsconfig.test.json",
  ],
  run: (ctx) => {
    const options = getTestingOptions(ctx);
    if (options.enable && options.runner === "jest") {
      throw new Error(
        "Jest is deprecated. Please consider using an alternative test runner.",
      );
    }
    const { pkg } = ctx;
    const initialPkg = ctx.initial.readJson<JsonObject>("package.json") ?? {};
    const build = ctx.config.build ?? {};
    const monorepoConfig = getRootMonorepoConfig(ctx) ?? {};
    const globalTesting = !!monorepoConfig.testing;
    const enableForMonorepo = options.monorepo && globalTesting;
    const transpileWithBabel =
      options.monorepo &&
      !!monorepoConfig.typescript &&
      monorepoConfig.typescript !== "check-only";
    const withTypescript =
      transpileWithBabel ||
      build.bundler === "tsc" ||
      (!!build.typescript && build.typescript !== "check-only");
    const testRunner = globalTesting
      ? monorepoConfig.testRunner
      : options.runner;
    if (testRunner === "jest" && withTypescript) {
      throw new Error("jest is no longer supported. Migrate to vitest.");
    }

    const withVitestBrowser = hasVitestBrowserPlaywright(initialPkg);

    if (!options.enable || (globalTesting && !enableForMonorepo)) {
      pkg.removeDevDependencies([
        "jest",
        "@types/jest",
        ...(withVitestBrowser ? [] : ["vitest"]),
        "@vitest/coverage-v8",
      ]);
      pkg.delete("jest");
      for (const extension of ["js", "mjs", "cjs", "json"]) {
        ctx.output.removed(`jest.config.${extension}`);
      }
    }

    const isVitestUsed =
      options.enable &&
      (enableForMonorepo || !globalTesting) &&
      testRunner === "vitest";
    pkg.addOrRemoveDevDependencies(isVitestUsed || withVitestBrowser, [
      "vitest",
    ]);
    pkg.addOrRemoveDevDependencies(isVitestUsed, ["@vitest/coverage-v8"]);
    if (isVitestUsed || withVitestBrowser) pkg.addDevDependencies(["vite"]);

    if (!options.enable) {
      pkg.removeScripts([
        "test",
        "test:coverage",
        "test:watch",
        "test:coverage:json",
        "test:coverage:lcov",
      ]);
      return;
    }

    const context: TestCommandContext = {
      options,
      testRunner,
      workspacesPattern: options.monorepo
        ? getWorkspacesPattern(pkg.get("workspaces"))
        : undefined,
      hasTestFolder: !options.monorepo && ctx.initial.exists("test"),
      hasTestSetup: ctx.initial.exists("src/test-setup.ts"),
    };

    if (options.monorepo && !globalTesting) {
      pkg.addScripts({ test: workspacesRun(options.packageManager, "test") });
      return;
    }
    pkg.removeScripts(["test:coverage:lcov", "test:coverage:json"]);
    if (options.monorepo) {
      pkg.addScripts(testScripts(context));
      return;
    }
    ctx.output.removed("tsconfig.test.json");
    if (globalTesting) {
      pkg.removeScripts(["test:watch", "test:coverage"]);
      // the root runs the tests of every package, with the coverage
      const relativeToRoot = path.relative(
        path.resolve(ctx.dir, "../.."),
        ctx.dir,
      );
      pkg.addScripts({
        test: `${packageManagerRunWithCwd(options.packageManager, "../..", "test")} -- ${quoteArg(relativeToRoot)}`,
      });
    } else {
      pkg.addScripts(testScripts(context));
    }
  },
});
