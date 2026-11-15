import { describe, expect, test } from "vitest";
import type { PackageContext } from "../../engine/context.ts";
import { createTestContext, runTestSteps } from "../../engine/testing.ts";
import { getOnlyLatestLTS, nodeStep, nodeTypesDependencyStep } from "./node.ts";
import { json, rootProject, yoRc } from "./testUtils.ts";

const NODE_22 = "^22.23.4 || ^24.22.1 || >=26.13.0";
const NODE_24 = "^24.22.1 || >=26.13.0";

const createContext = (
  pob: Record<string, unknown>,
  pkg: Record<string, unknown>,
): PackageContext =>
  createTestContext({
    files: {
      ".yo-rc.json": yoRc({ project: rootProject, ...pob }),
      "package.json": json({ name: "test", ...pkg }),
    },
  });

const runNode = async (ctx: PackageContext): Promise<unknown> => {
  await runTestSteps(ctx, [nodeTypesDependencyStep, nodeStep]);
  return ctx.pkg.snapshot();
};

describe("getOnlyLatestLTS", () => {
  test("lib: every node env targets the latest LTS", () => {
    expect(
      getOnlyLatestLTS(
        createContext(
          { lib: {} },
          { pob: { envs: [{ target: "node", version: "24" }] } },
        ),
      ),
    ).toBe(true);
    expect(
      getOnlyLatestLTS(
        createContext(
          { lib: {} },
          { pob: { envs: [{ target: "node", version: "22" }] } },
        ),
      ),
    ).toBe(false);
    expect(getOnlyLatestLTS(createContext({ lib: {} }, { pob: {} }))).toBe(
      false,
    );
  });

  test("app: node app types only", () => {
    const appContext = (type: string): PackageContext =>
      createContext(
        { project: { ...rootProject, type: "app" }, app: { type } },
        {},
      );
    expect(getOnlyLatestLTS(appContext("node"))).toBe(true);
    expect(getOnlyLatestLTS(appContext("alp-node"))).toBe(true);
    expect(getOnlyLatestLTS(appContext("vite"))).toBe(false);
  });

  test("monorepo root: app project or onlyLatestLTS", () => {
    const monorepoContext = (project: Record<string, unknown>) =>
      createTestContext({
        facts: { isMonorepoRoot: true },
        files: {
          ".yo-rc.json": yoRc({
            project: { ...rootProject, ...project },
            monorepo: {},
          }),
          "package.json": json({ name: "root", workspaces: ["packages/*"] }),
        },
      });
    expect(getOnlyLatestLTS(monorepoContext({}))).toBe(false);
    expect(getOnlyLatestLTS(monorepoContext({ onlyLatestLTS: true }))).toBe(
      true,
    );
    expect(getOnlyLatestLTS(monorepoContext({ supportsNode14: false }))).toBe(
      true,
    );
    expect(getOnlyLatestLTS(monorepoContext({ type: "app" }))).toBe(true);
  });
});

describe("node", () => {
  test("sets engines.node and @types/node from envs", async () => {
    const pkg = await runNode(
      createContext(
        { lib: {} },
        {
          pob: { envs: [{ target: "node", version: "24" }] },
          dependencies: { "@types/node": "*" },
          devDependencies: { "@types/node": "22.5.0" },
        },
      ),
    );
    expect(pkg).toMatchObject({
      engines: { node: NODE_24 },
      dependencies: { "@types/node": ">=24.0.0" },
      // a range: the test pob-dependencies version, 11.0.0, is too low
      devDependencies: { "@types/node": ">=24.0.0" },
    });
  });

  test("uses the maintenance LTS without envs and keeps other engines", async () => {
    const pkg = await runNode(
      createContext({ lib: {} }, { engines: { pnpm: ">=10" } }),
    );
    expect(pkg).toMatchObject({ engines: { node: NODE_22, pnpm: ">=10" } });
  });

  test("removes @types/node without a node target", async () => {
    const pkg = (await runNode(
      createContext(
        { lib: {} },
        {
          pob: { envs: [{ target: "browser" }] },
          dependencies: { "@types/node": ">=22.0.0" },
          devDependencies: { "@types/node": "24.13.3", typescript: "6.0.0" },
        },
      ),
    )) as Record<string, unknown>;
    expect(pkg.dependencies).toBeUndefined();
    expect(pkg.devDependencies).toEqual({ typescript: "6.0.0" });
    // a lib without node env only supports the latest LTS
    expect(pkg.engines).toEqual({ node: NODE_24 });
  });
});
