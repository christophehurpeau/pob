import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import {
  getAppTsconfigTarget,
  getConsumerAppsTsconfigTarget,
} from "./appTsconfigTarget.js";

const targets = {
  expo: "@pob/root/tsconfigs/targets/expo.json",
  vite: "@pob/root/tsconfigs/targets/vite.json",
  webpack: "@pob/root/tsconfigs/targets/webpack.json",
  bun: "@pob/root/tsconfigs/targets/bun.json",
};

describe("getAppTsconfigTarget", () => {
  it("returns expo for expo apps", () => {
    expect(getAppTsconfigTarget({ appType: "expo", dom: false })).toBe(
      targets.expo,
    );
  });

  it("returns vite for vite apps", () => {
    expect(getAppTsconfigTarget({ appType: "vite", dom: true })).toBe(
      targets.vite,
    );
    expect(
      getAppTsconfigTarget({ appType: "vite-with-server", dom: true }),
    ).toBe(targets.vite);
  });

  it("returns webpack for other browser apps and dom libraries", () => {
    expect(getAppTsconfigTarget({ appType: "alp", dom: true })).toBe(
      targets.webpack,
    );
    expect(getAppTsconfigTarget({ appType: undefined, dom: true })).toBe(
      targets.webpack,
    );
  });

  it("returns bun without dom with bun", () => {
    expect(
      getAppTsconfigTarget({ appType: "node", dom: false, withBun: true }),
    ).toBe(targets.bun);
  });

  it("returns undefined for node apps", () => {
    expect(getAppTsconfigTarget({ appType: "node", dom: false })).toBe(
      undefined,
    );
  });
});

async function writeWorkspace(rootPath, location, pkg, pobConfig) {
  const dir = path.join(rootPath, location);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "package.json"), JSON.stringify(pkg));
  if (pobConfig) {
    await fs.writeFile(
      path.join(dir, ".yo-rc.json"),
      JSON.stringify({ pob: pobConfig }),
    );
  }
}

const app = (type) => ({ project: { type: "app" }, app: { type } });

/**
 * Monorepo with an untranspiled library "@ex/lib" and the given consumers,
 * each one an [appType, pobConfig] pair depending on the library.
 */
async function prepareMonorepo(consumers) {
  const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), "pob-"));
  await writeWorkspace(rootPath, ".", {
    name: "root",
    workspaces: ["packages/*"],
  });
  await writeWorkspace(
    rootPath,
    "packages/lib",
    { name: "@ex/lib" },
    app("untranspiled-library"),
  );
  for (const [name, pobConfig] of consumers) {
    await writeWorkspace(
      rootPath,
      `packages/${name}`,
      { name: `@ex/${name}`, dependencies: { "@ex/lib": "workspace:*" } },
      pobConfig,
    );
  }
  return rootPath;
}

const getLibTarget = async (consumers, { withBun = false } = {}) =>
  getConsumerAppsTsconfigTarget({
    rootPath: await prepareMonorepo(consumers),
    packageName: "@ex/lib",
    withBun,
  });

describe("getConsumerAppsTsconfigTarget", () => {
  it("uses the target of a consumer expo app", async () => {
    expect(await getLibTarget([["mobile", app("expo")]])).toBe(targets.expo);
  });

  it("prefers expo when consumer apps disagree", async () => {
    expect(
      await getLibTarget([
        ["mobile", app("expo")],
        ["web", app("vite")],
        ["api", app("node")],
      ]),
    ).toBe(targets.expo);
  });

  it("uses the target shared by all consumer apps", async () => {
    expect(
      await getLibTarget([
        ["web", app("vite")],
        ["api", app("node")],
      ]),
    ).toBe(targets.vite);
  });

  it("returns undefined when consumer apps disagree without expo", async () => {
    expect(
      await getLibTarget([
        ["web", app("vite")],
        ["legacy", app("alp")],
      ]),
    ).toBe(undefined);
  });

  it("returns undefined without consumer apps with a target", async () => {
    expect(await getLibTarget([])).toBe(undefined);
    expect(await getLibTarget([["api", app("node")]])).toBe(undefined);
    expect(
      await getLibTarget([["other-lib", { project: { type: "lib" } }]]),
    ).toBe(undefined);
    expect(await getLibTarget([["no-config", undefined]])).toBe(undefined);
  });

  it("uses bun for node consumer apps with bun", async () => {
    expect(await getLibTarget([["api", app("node")]], { withBun: true })).toBe(
      targets.bun,
    );
  });

  it("ignores apps depending on the library through another library", async () => {
    const rootPath = await prepareMonorepo([
      ["other-lib", app("untranspiled-library")],
    ]);
    await writeWorkspace(
      rootPath,
      "packages/mobile",
      { name: "@ex/mobile", dependencies: { "@ex/other-lib": "workspace:*" } },
      app("expo"),
    );
    expect(
      await getConsumerAppsTsconfigTarget({
        rootPath,
        packageName: "@ex/lib",
        withBun: false,
      }),
    ).toBe(undefined);
  });
});
