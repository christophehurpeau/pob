import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createWatchWorkspaceDependencies } from "./index.js";

const writeJson = (filePath, value) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value));
};

describe("createWatchWorkspaceDependencies", () => {
  let root;
  let appDirectory;

  /** a workspace package, linked in the root node_modules as pnpm hoists it */
  const addWorkspacePackage = (name, pkg) => {
    const directory = path.join(root, "packages", name);
    writeJson(path.join(directory, "package.json"), { name, ...pkg });
    fs.mkdirSync(path.join(root, "node_modules"), { recursive: true });
    fs.symlinkSync(directory, path.join(root, "node_modules", name), "dir");
    return fs.realpathSync(directory);
  };

  const watchedFiles = async (pkg, { watchMode = true } = {}) => {
    const addWatchFile = vi.fn();
    await createWatchWorkspaceDependencies(appDirectory, pkg).buildStart.call({
      meta: { watchMode },
      addWatchFile,
      warn: vi.fn(),
    });
    return addWatchFile.mock.calls.map(([file]) => file);
  };

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "pob-rollup-"));
    appDirectory = path.join(root, "packages", "app");
    fs.mkdirSync(appDirectory, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("watches the build node imports of each workspace dependency", async () => {
    const core = addWorkspacePackage("core", {
      exports: {
        "./package.json": "./package.json",
        ".": {
          types: "./src/index.ts",
          node: { import: "./build/index-node.mjs" },
        },
      },
    });
    const legacy = addWorkspacePackage("legacy", { main: "./dist/index.js" });
    const builtFiles = [
      path.join(core, "build/index-node.mjs"),
      path.join(legacy, "dist/index.js"),
    ];
    builtFiles.forEach((builtFile) => {
      fs.mkdirSync(path.dirname(builtFile));
      fs.writeFileSync(builtFile, "export {};");
    });

    expect(
      await watchedFiles({
        dependencies: { core: "workspace:*", legacy: "workspace:^" },
      }),
    ).toEqual(builtFiles);
  });

  it("leaves out sources, registry dependencies and unknown packages", async () => {
    addWorkspacePackage("untranspiled", { exports: "./src/index.ts" });
    addWorkspacePackage("published", { main: "./index.js" });

    expect(
      await watchedFiles({
        dependencies: {
          untranspiled: "workspace:*",
          published: "1.0.0",
          missing: "workspace:*",
        },
      }),
    ).toEqual([]);
  });

  it("watches nothing outside watch mode", async () => {
    addWorkspacePackage("core", { main: "./build/index.js" });

    expect(
      await watchedFiles(
        { dependencies: { core: "workspace:*" } },
        { watchMode: false },
      ),
    ).toEqual([]);
  });

  it("waits for a dependency being rebuilt before watching it", async () => {
    const core = addWorkspacePackage("core", { main: "./build/index.js" });
    const builtFile = path.join(core, "build/index.js");
    setTimeout(() => {
      fs.mkdirSync(path.dirname(builtFile));
      fs.writeFileSync(builtFile, "export {};");
    }, 150);

    expect(
      await watchedFiles({ dependencies: { core: "workspace:*" } }),
    ).toEqual([builtFile]);
    expect(fs.existsSync(builtFile)).toBe(true);
  });
});
