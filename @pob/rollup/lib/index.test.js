import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSourceWorkspaceDependencies,
  createWatchWorkspaceDependencies,
} from "./index.js";

const writeJson = (filePath, value) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value));
};

describe("createSourceWorkspaceDependencies", () => {
  let root;
  let appDirectory;

  const addWorkspacePackage = (name, pkg) => {
    const directory = path.join(root, "packages", name);
    writeJson(path.join(directory, "package.json"), { name, ...pkg });
    fs.mkdirSync(path.join(directory, "src"), { recursive: true });
    fs.writeFileSync(path.join(directory, "src/index.ts"), "export {};");
    fs.mkdirSync(path.join(root, "node_modules"), { recursive: true });
    fs.symlinkSync(directory, path.join(root, "node_modules", name), "dir");
    return fs.realpathSync(directory);
  };

  const resolveImports = (pkg, sources) => {
    const warn = vi.fn();
    const { plugin } = createSourceWorkspaceDependencies(appDirectory, pkg);
    const resolved = sources.map((source) =>
      plugin.resolveId.call({ warn }, source),
    );
    return { resolved, warnings: warn.mock.calls.map(([message]) => message) };
  };

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "pob-rollup-"));
    appDirectory = path.join(root, "packages", "app");
    fs.mkdirSync(appDirectory, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("resolves a source dependency to its source, without warning", () => {
    const shared = addWorkspacePackage("shared", { exports: "./src/index.ts" });

    expect(
      resolveImports({ dependencies: { shared: "workspace:*" } }, ["shared"]),
    ).toEqual({
      resolved: [path.join(shared, "src/index.ts")],
      warnings: [],
    });
  });

  it("resolves a source devDependency, warning once to move it", () => {
    const shared = addWorkspacePackage("shared", { exports: "./src/index.ts" });

    expect(
      resolveImports({ devDependencies: { shared: "workspace:*" } }, [
        "shared",
        "shared",
      ]),
    ).toEqual({
      resolved: [
        path.join(shared, "src/index.ts"),
        path.join(shared, "src/index.ts"),
      ],
      warnings: [
        '"shared" is imported but listed in devDependencies: move it to dependencies.',
      ],
    });
  });

  it("leaves other imports to the other resolvers", () => {
    addWorkspacePackage("shared", { exports: "./src/index.ts" });

    expect(
      resolveImports({ dependencies: { shared: "workspace:*" } }, ["other"]),
    ).toEqual({ resolved: [null], warnings: [] });
  });
});

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
