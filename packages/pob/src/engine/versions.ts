import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type DependencyVersions = (dependency: string) => string | undefined;

const readJson = (filePath: string): Record<string, unknown> =>
  JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<string, unknown>;

const findUp = (from: string, fileName: string): string | undefined => {
  let directory = from;
  for (;;) {
    if (fs.existsSync(path.join(directory, fileName))) return directory;
    const parent = path.dirname(directory);
    if (parent === directory) return undefined;
    directory = parent;
  }
};

const engineDirectory = path.dirname(fileURLToPath(import.meta.url));

const readPobPackageJson = (): Record<string, unknown> => {
  const pobDirectory = findUp(engineDirectory, "package.json");
  if (!pobDirectory) throw new Error("pob package.json not found");
  return readJson(path.join(pobDirectory, "package.json"));
};

const isWorkspaceRange = (version: string): boolean =>
  version === "workspace:*" ||
  version === "workspace:^" ||
  version === "workspace:~";

/**
 * In the pob monorepo, pob-dependencies refers to its sibling packages with a
 * workspace range: use their current version.
 */
const readWorkspaceVersion = (dependency: string): string => {
  const monorepoRoot = findUp(engineDirectory, "pnpm-workspace.yaml");
  if (!monorepoRoot) {
    throw new Error(`Cannot resolve the workspace version of ${dependency}`);
  }
  const location = dependency.startsWith("@")
    ? dependency
    : `packages/${dependency}`;
  return readJson(path.join(monorepoRoot, location, "package.json"))
    .version as string;
};

/** Versions pob installs, from pob-dependencies. */
export const createDependencyVersions = (): DependencyVersions => {
  const pobPkg = readPobPackageJson();
  const cache = new Map<string, string | undefined>();
  const devDependencies = (
    createRequire(import.meta.url)("pob-dependencies/package.json") as {
      devDependencies: Record<string, string>;
    }
  ).devDependencies;

  const resolve = (dependency: string): string | undefined => {
    // loaded by name by import-x, from the project with yarn PnP
    if (dependency === "@typescript-eslint/parser") {
      const eslintConfigPkg = readJson(
        fileURLToPath(import.meta.resolve("@pob/eslint-config/package.json")),
      );
      return (eslintConfigPkg.dependencies as Record<string, string>)[
        dependency
      ];
    }
    // prevents cycle that lerna doesnt like
    const value =
      dependency === "@pob/root"
        ? (pobPkg.devDependencies as Record<string, string>)[dependency]
        : devDependencies[dependency];
    if (value && isWorkspaceRange(value)) {
      return readWorkspaceVersion(dependency);
    }
    return value;
  };

  return (dependency) => {
    if (!cache.has(dependency)) cache.set(dependency, resolve(dependency));
    return cache.get(dependency);
  };
};
