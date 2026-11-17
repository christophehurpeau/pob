import { describe, expect, test } from "vitest";
import type { PackageContext } from "../engine/context.ts";
import { createTestContext } from "../engine/testing.ts";
import { getTestingOptions } from "./quality/settings.ts";
import { getReleaseOptions } from "./release/settings.ts";
import { getMonorepoSettings } from "./settings.ts";

const json = (value: unknown): string => JSON.stringify(value, null, 2);

const pobPackage = (): PackageContext =>
  createTestContext({
    location: "packages/pob-lib",
    files: {
      "package.json": json({ name: "pob-lib", private: true }),
      ".yo-rc.json": json({
        pob: { project: { type: "lib" }, lib: { testing: false } },
      }),
    },
    facts: { isRoot: false },
  });

/** workspaces without a pob config: pob does not update them */
const otherWorkspaces = [
  { location: "packages/react-ui", pkg: { dependencies: { react: "19" } } },
  {
    location: "packages/browser-tests",
    pkg: {
      private: true,
      devDependencies: { "@vitest/browser-playwright": "5.0.0" },
    },
  },
  { location: "packages/bundled", pkg: { pob: { bundler: "rollup-esbuild" } } },
  {
    location: "packages/stories",
    pkg: { devDependencies: { "@storybook/react-native": "9.0.0" } },
  },
  ...["one", "two", "three", "four", "five"].map((name) => ({
    location: `packages/${name}`,
    pkg: { private: true },
  })),
];

const createRoot = (project: Record<string, unknown>): PackageContext =>
  createTestContext({
    files: {
      "package.json": json({
        name: "root",
        private: true,
        workspaces: ["packages/*"],
      }),
      ".yo-rc.json": json({
        pob: {
          project: { packageManager: "yarn", ci: true, ...project },
          monorepo: { testing: true, testRunner: "vitest", typescript: false },
        },
      }),
    },
    facts: { isMonorepoRoot: true },
    workspacePackages: [pobPackage()],
    otherWorkspaces,
  });

describe("monorepo detections over every workspace", () => {
  test("workspaces without a pob config count", () => {
    const settings = getMonorepoSettings(createRoot({ type: "lib" }));
    expect(settings.packages.map(({ location }) => location)).toEqual([
      "packages/pob-lib",
      ...otherWorkspaces.map(({ location }) => location),
    ]);
    // package.json#pob of a workspace without a pob config
    expect(settings.hasRootBuild).toBe(true);
    expect(settings.monorepo.storybookReactNative).toBe(true);
  });

  test("ci jobs split and vitest browser path", () => {
    const testing = getTestingOptions(createRoot({ type: "lib" }));
    expect(testing.splitCIJobs).toBe(true);
    expect(testing.playwrightBrowserTestingPath).toBe("packages/browser-tests");
  });

  test("an app monorepo publishes its public workspaces", () => {
    expect(getReleaseOptions(createRoot({ type: "app" })).enablePublish).toBe(
      true,
    );
  });
});
