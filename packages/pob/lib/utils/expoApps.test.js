import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { hasExpoApp, isExpoApp } from "./expoApps.js";

const app = (type) => ({ project: { type: "app" }, app: { type } });

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

/** Monorepo with a workspace for each [name, pobConfig] pair */
async function prepareMonorepo(workspaces) {
  const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), "pob-"));
  await writeWorkspace(rootPath, ".", {
    name: "root",
    workspaces: ["packages/*"],
  });
  for (const [name, pobConfig] of workspaces) {
    await writeWorkspace(rootPath, `packages/${name}`, { name }, pobConfig);
  }
  return rootPath;
}

const rootPobConfig = { project: { type: "lib" } };

describe("isExpoApp", () => {
  it("returns true for an expo app", () => {
    expect(isExpoApp(app("expo"))).toBe(true);
  });

  it("returns false for other apps, libraries and missing configs", () => {
    expect(isExpoApp(app("vite"))).toBe(false);
    expect(isExpoApp({ project: { type: "lib" }, app: { type: "expo" } })).toBe(
      false,
    );
    expect(isExpoApp(undefined)).toBe(false);
  });
});

describe("hasExpoApp", () => {
  it("returns true when the project is an expo app", async () => {
    const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), "pob-"));
    await writeWorkspace(rootPath, ".", { name: "mobile" });
    expect(await hasExpoApp({ rootPath, pobConfig: app("expo") })).toBe(true);
  });

  it("returns false for a project without workspaces", async () => {
    const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), "pob-"));
    await writeWorkspace(rootPath, ".", { name: "web" });
    expect(await hasExpoApp({ rootPath, pobConfig: app("vite") })).toBe(false);
  });

  it("returns true when a workspace is an expo app", async () => {
    const rootPath = await prepareMonorepo([
      ["lib", rootPobConfig],
      ["expo-demo-app", app("expo")],
    ]);
    expect(await hasExpoApp({ rootPath, pobConfig: rootPobConfig })).toBe(true);
  });

  it("returns false when no workspace is an expo app", async () => {
    const rootPath = await prepareMonorepo([
      ["lib", rootPobConfig],
      ["web", app("vite")],
      ["no-pob-config", undefined],
    ]);
    expect(await hasExpoApp({ rootPath, pobConfig: rootPobConfig })).toBe(
      false,
    );
  });
});
