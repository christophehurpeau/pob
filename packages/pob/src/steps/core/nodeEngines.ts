/**
 * engines.node and @types/node from the pob envs: port of
 * lib/utils/nodeEngines.js, on plain values instead of a mutated package.json.
 */
import semver from "semver";
import type { BuildConfig, BuildEnv } from "../../engine/config.ts";
import { latestLTS, maintenanceLTS } from "../../utils/misc.ts";

// Min versions are the October 2026 security releases (CVE-2026-105482,
// CVE-2026-111497...), above 22.18.0 which has strip typescript stable.
// 26.13.0 is the first 26 LTS, with the same code as security release 26.12.1.
// Odd majors are skipped: features backported to 22 are experimental in 23.
const enginesNodeForMajor = new Map([
  ["22", "^22.23.4 || ^24.22.1 || >=26.13.0"],
  ["24", "^24.22.1 || >=26.13.0"],
  ["26", ">=26.13.0"],
]);

const legacyMajors = new Set([
  "4",
  "6",
  "8",
  "10",
  "12",
  "14",
  "16",
  "18",
  "20",
]);

const getEnginesNodeForMajor = (major: string): string => {
  const enginesNode = enginesNodeForMajor.get(major);
  if (!enginesNode) throw new Error(`Invalid min node version: ${major}`);
  return enginesNode;
};

/**
 * Min node major supported, from pob envs when defined, from the LTS otherwise.
 */
export const getEnvsMinNodeMajor = (
  envs: readonly BuildEnv[] | undefined,
  onlyLatestLTS: boolean,
): string => {
  if (!envs) return onlyLatestLTS ? latestLTS : maintenanceLTS;
  return String(
    Math.min(
      ...envs
        .filter((env) => env.target === "node")
        .map((env) => Number(env.version)),
    ),
  );
};

/**
 * Min version of a range, undefined when missing or not parseable
 * (workspace:*, catalog:, npm: alias...).
 */
const getMinVersion = (range: unknown): semver.SemVer | undefined => {
  if (!range || typeof range !== "string") return undefined;
  try {
    return semver.minVersion(range) ?? undefined;
  } catch {
    return undefined;
  }
};

/** Min node major of a range, undefined when missing or not parseable. */
export const getMinMajor = (range: unknown): number | undefined => {
  const minVersion = getMinVersion(range);
  return minVersion ? semver.major(minVersion) : undefined;
};

/**
 * engines.node value for a min node major. An engines.node with a higher min
 * version is kept, to guarantee a node version with a security fix: within
 * the min major when envs are defined, any higher version otherwise.
 */
export const resolveEnginesNode = (
  currentEnginesNode: unknown,
  minNodeMajor: string,
  hasEnvs: boolean,
): string => {
  const major = legacyMajors.has(minNodeMajor) ? maintenanceLTS : minNodeMajor;
  const enginesNode = enginesNodeForMajor.get(major);
  const minVersion = enginesNode && semver.minVersion(enginesNode)?.version;
  if (!enginesNode || !minVersion) {
    throw new Error(`Invalid min node version: ${minNodeMajor}`);
  }

  const currentMinVersion = getMinVersion(currentEnginesNode);
  if (
    currentMinVersion &&
    semver.gt(currentMinVersion, minVersion) &&
    (!hasEnvs || semver.major(currentMinVersion) === Number(major))
  ) {
    return currentEnginesNode as string;
  }
  return enginesNode;
};

export const getBuildEnvs = (
  build: BuildConfig | undefined,
): BuildEnv[] | undefined =>
  build?.envs ?? (build?.babelEnvs as BuildEnv[] | undefined);

/** Whether @types/node is kept: false when every env targets browsers. */
export const hasNodeTarget = (envs: readonly BuildEnv[] | undefined): boolean =>
  !envs || envs.some((env) => env.target === "node");

/** engines.node after pob: only raised, never lowered. */
export const computeEnginesNode = (
  currentEnginesNode: unknown,
  envs: readonly BuildEnv[] | undefined,
  onlyLatestLTS: boolean,
): string => {
  if (hasNodeTarget(envs)) {
    return resolveEnginesNode(
      currentEnginesNode,
      getEnvsMinNodeMajor(envs, onlyLatestLTS),
      !!envs,
    );
  }
  // Supports oldest current or active LTS version of node
  const enginesNode = getEnginesNodeForMajor(
    onlyLatestLTS ? latestLTS : maintenanceLTS,
  );
  const currentMinVersion = getMinVersion(currentEnginesNode);
  const minVersion = getMinVersion(enginesNode);
  if (
    !currentEnginesNode ||
    (currentMinVersion &&
      minVersion &&
      semver.lte(currentMinVersion, minVersion))
  ) {
    return enginesNode;
  }
  return currentEnginesNode as string;
};

/** dependencies["@types/node"] for engines.node: never added. */
export const typesNodeDependencyRange = (
  enginesNode: string,
): string | undefined => {
  const minMajor = getMinMajor(enginesNode);
  return minMajor === undefined ? undefined : `>=${minMajor}.0.0`;
};

/**
 * devDependencies["@types/node"] for engines.node. Never added, never
 * lowered. A pinned devDependency stays pinned
 * (check-package-dependencies/require-pinned-versions), with the
 * pob-dependencies version when it satisfies the min major.
 */
export const typesNodeDevDependencyVersion = (
  currentDevVersion: string,
  enginesNode: string,
  pinnedVersion: string,
): string => {
  const minMajor = getMinMajor(enginesNode);
  if (minMajor === undefined) return currentDevVersion;
  const currentMinMajor = getMinMajor(currentDevVersion);
  if (currentMinMajor === undefined || currentMinMajor >= minMajor) {
    return currentDevVersion;
  }
  return semver.valid(currentDevVersion) &&
    semver.major(pinnedVersion) >= minMajor
    ? pinnedVersion
    : `>=${minMajor}.0.0`;
};
