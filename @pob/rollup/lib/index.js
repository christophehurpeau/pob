import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

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
