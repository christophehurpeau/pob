/**
 * The other packages of a monorepo, seen from one of its packages. When pob
 * runs at the root, the contexts of the packages with a pob config are known:
 * dependencies ran before (topological order), so their final outputs are
 * read. Otherwise their files are read from disk.
 */
import path from "node:path";
import type { PobConfig } from "../../engine/config.ts";
import { resolveConfig } from "../../engine/config.ts";
import type {
  MonorepoWorkspace,
  PackageContext,
} from "../../engine/context.ts";
import type { InitialFiles } from "../../engine/files.ts";
import { createDiskFiles } from "../../engine/files.ts";
import type { JsonObject } from "../../engine/model.ts";
import { discoverWorkspacePackages } from "../../engine/workspace.ts";

export const readRelativeFiles = (
  ctx: PackageContext,
  relativePath: string,
): InitialFiles => createDiskFiles(path.resolve(ctx.dir, relativePath));

const dependencyTypes = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
] as const;

export const dependsOn = (pkg: JsonObject, packageName: string): boolean =>
  dependencyTypes.some(
    (type) => !!(pkg[type] as JsonObject | undefined)?.[packageName],
  );

/** the name a dependency resolves to, `npm:` aliases included */
const npmNameFromDependency = (key: string, value: unknown): string => {
  if (typeof value !== "string" || !value.startsWith("npm:")) return key;
  const target = value.slice("npm:".length);
  if (!target.startsWith("@")) return target.split("@", 1)[0] ?? key;
  const [name = ""] = target.slice(1).split("@", 1);
  return `@${name}`;
};

const dependsOnWorkspace = (pkg: JsonObject, packageName: string): boolean =>
  dependencyTypes.some((type) =>
    Object.entries((pkg[type] as JsonObject | undefined) ?? {}).some(
      ([key, value]) =>
        !!value && npmNameFromDependency(key, value) === packageName,
    ),
  );

/** names of every workspace package, in the order of the monorepo generator */
export const getWorkspacePackageNames = (ctx: PackageContext): string[] => {
  const inMonorepo = ctx.facts.inMonorepo;
  if (!inMonorepo) return [];
  return discoverWorkspacePackages(inMonorepo.rootDir, inMonorepo.rootPkg)
    .map(({ name }) => name)
    .filter((name): name is string => name !== undefined);
};

const readPobConfig = (files: InitialFiles): PobConfig | undefined => {
  const pobJson = files.readJson("pob.json");
  const yoRc = files.readJson<{ pob?: JsonObject }>(".yo-rc.json")?.pob;
  if (!pobJson && !yoRc) return undefined;
  return resolveConfig({ pobJson, yoRc }, { isRoot: false }).config;
};

/** another workspace of the monorepo, by name */
export const findSiblingPackage = (
  ctx: PackageContext,
  packageName: string,
): MonorepoWorkspace | undefined =>
  ctx.siblingPackages.find((sibling) => sibling.pkg.name === packageName);

/** configs of the workspaces (root included) depending on a package */
export const getDependentConfigs = (
  ctx: PackageContext,
  packageName: string,
): PobConfig[] => {
  const inMonorepo = ctx.facts.inMonorepo;
  if (!inMonorepo) return [];
  const root = dependsOnWorkspace(inMonorepo.rootPkg, packageName)
    ? [inMonorepo.rootConfig]
    : [];
  const packages = ctx.siblingPackages
    .filter(({ pkg }) => dependsOnWorkspace(pkg, packageName))
    // the normalized config of the package, which its steps see
    .map(({ context, initial }) => context?.config ?? readPobConfig(initial));
  return [...root, ...packages].filter(
    (config): config is PobConfig => config !== undefined,
  );
};
