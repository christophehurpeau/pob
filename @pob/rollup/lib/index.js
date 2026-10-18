import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { setTimeout } from "node:timers/promises";

export const nodeFormatToExt = (format, pkgType) => {
  if (format === "cjs" && pkgType === "module") return ".cjs";
  if (format === "cjs") return ".cjs.js";
  if (format === "es") return ".mjs";
  return `.${format}.js`;
};

export const resolveEntry = (cwd, entryName) => {
  let entryPath;
  ["ts", "tsx", "js", "jsx"].some((extension) => {
    const potentialEntryPath = path.resolve(
      cwd,
      "src",
      `${entryName}.${extension}`,
    );

    if (fs.existsSync(potentialEntryPath)) {
      entryPath = potentialEntryPath;
      return true;
    }

    return false;
  });

  if (!entryPath) {
    throw new Error(`Could not find entry "src/${entryName}" in path "${cwd}"`);
  }

  return entryPath;
};

const sourceExtensionRegExp = /\.[cm]?tsx?$/;

const readClosestPackageJson = (filePath) => {
  let directory = path.dirname(filePath);
  while (directory !== path.dirname(directory)) {
    const pkgPath = path.join(directory, "package.json");
    if (fs.existsSync(pkgPath)) {
      return JSON.parse(fs.readFileSync(pkgPath));
    }
    directory = path.dirname(directory);
  }
  return {};
};

/**
 * Workspace dependencies whose entry is a typescript source, like the
 * "untranspiled-library" apps of pob. They must be bundled: node does not strip
 * types under node_modules, so the build could not run outside the monorepo.
 */
export const createSourceWorkspaceDependencies = (cwd, pkg) => {
  const require = createRequire(path.join(cwd, "package.json"));
  const resolve = (source) => {
    try {
      return fs.realpathSync(require.resolve(source));
    } catch {
      return undefined;
    }
  };

  const dependencies = Object.entries(pkg.dependencies || {})
    .filter(([, version]) => version.startsWith("workspace:"))
    .flatMap(([name]) => {
      const entryPath = resolve(name);
      if (!entryPath || !sourceExtensionRegExp.test(entryPath)) return [];
      return [{ name, pkg: readClosestPackageJson(entryPath) }];
    });

  const isSourceWorkspaceDependency = (id) =>
    dependencies.some(({ name }) => id === name || id.startsWith(`${name}/`));

  return {
    isSourceWorkspaceDependency,
    // their own dependencies stay external
    pkgs: dependencies.map((dependency) => dependency.pkg),
    plugin: {
      name: "@pob/rollup/source-workspace-dependencies",
      resolveId(source) {
        if (!isSourceWorkspaceDependency(source)) return null;
        return resolve(source) ?? null;
      },
    },
  };
};

const nodeImportConditions = new Set(["node", "import", "default"]);

const resolveExportTarget = (target) => {
  if (typeof target === "string") return target;
  if (!target || typeof target !== "object" || Array.isArray(target)) {
    return undefined;
  }
  for (const [condition, value] of Object.entries(target)) {
    if (nodeImportConditions.has(condition)) {
      const resolved = resolveExportTarget(value);
      if (resolved) return resolved;
    }
  }
  return undefined;
};

/** the file node imports for the package's main entry */
const getMainEntry = (pkg) => {
  const { exports } = pkg;
  if (exports === undefined) return pkg.module ?? pkg.main;
  if (typeof exports === "string") return exports;
  const isSubpathMap = Object.keys(exports).some((key) => key.startsWith("."));
  return resolveExportTarget(isSubpathMap ? exports["."] : exports);
};

const dependencyPollIntervalMs = 100;
const dependencySlowAfterMs = 5000;

const waitForFile = async (file, onSlow) => {
  let waitedMs = 0;
  while (!fs.existsSync(file)) {
    if (waitedMs === dependencySlowAfterMs) onSlow();
    await setTimeout(dependencyPollIntervalMs);
    waitedMs += dependencyPollIntervalMs;
  }
};

const findDependencyPackageJson = (cwd, name) => {
  let directory = cwd;
  while (true) {
    const pkgPath = path.join(directory, "node_modules", name, "package.json");
    if (fs.existsSync(pkgPath)) return fs.realpathSync(pkgPath);
    if (directory === path.dirname(directory)) return undefined;
    directory = path.dirname(directory);
  }
};

/**
 * Workspace dependencies imported from their build stay external, and node
 * loads them once: the process started by the run plugin would keep running a
 * stale build of them. Watching their entry rebuilds, and so restarts it, each
 * time one of them is rebuilt. A watched file that gets deleted, by the
 * `clean:build` of its package, is no longer watched once recreated: the
 * rebuild its deletion triggers waits for it to come back, and watches the new
 * one.
 */
export const createWatchWorkspaceDependencies = (cwd, pkg) => {
  const builtEntries = Object.entries(pkg.dependencies || {})
    .filter(([, version]) => version.startsWith("workspace:"))
    .flatMap(([name]) => {
      const dependencyPkgPath = findDependencyPackageJson(cwd, name);
      if (!dependencyPkgPath) return [];
      const entry = getMainEntry(
        JSON.parse(fs.readFileSync(dependencyPkgPath)),
      );
      if (!entry || sourceExtensionRegExp.test(entry)) return [];
      return [path.resolve(path.dirname(dependencyPkgPath), entry)];
    });

  return {
    name: "@pob/rollup/watch-workspace-dependencies",
    async buildStart() {
      if (!this.meta.watchMode) return;
      for (const entry of builtEntries) {
        await waitForFile(entry, () => {
          this.warn(`Waiting for ${entry} to be built`);
        });
        this.addWatchFile(entry);
      }
    },
  };
};
