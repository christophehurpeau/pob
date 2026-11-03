import pobDependencies from "pob-dependencies";
import semver from "semver";
import { latestLTS, maintenanceLTS } from "./nodeVersions.js";
import * as packageUtils from "./package.js";

// Min versions are the October 2026 security releases (CVE-2026-105482,
// CVE-2026-111497...), above 22.18.0 which has strip typescript stable.
// 26.13.0 is the first 26 LTS, with the same code as security release 26.12.1.
// Odd majors are skipped: features backported to 22 are experimental in 23.
const enginesNodeForMajor = new Map([
  ["22", "^22.23.4 || ^24.22.1 || >=26.13.0"],
  ["24", "^24.22.1 || >=26.13.0"],
  ["26", ">=26.13.0"],
]);

const minVersionForMajor = (major) => {
  const enginesNode = enginesNodeForMajor.get(major);
  return enginesNode && semver.minVersion(enginesNode).version;
};

const legacyMajors = ["4", "6", "8", "10", "12", "14", "16", "18", "20"];

/**
 * Min node major supported, from pob envs when defined, from the LTS otherwise.
 */
export const getEnvsMinNodeMajor = (envs, onlyLatestLTS) => {
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
const getMinVersion = (range) => {
  if (!range) return undefined;
  try {
    return semver.minVersion(range) ?? undefined;
  } catch {
    return undefined;
  }
};

/**
 * Min node major of a range, undefined when missing or not parseable
 * (workspace:*, catalog:, npm: alias...).
 */
export const getMinMajor = (range) => {
  const minVersion = getMinVersion(range);
  return minVersion ? semver.major(minVersion) : undefined;
};

/**
 * engines.node value for a min node major. An engines.node with a higher min
 * version is kept, to guarantee a node version with a security fix: within
 * the min major when envs are defined, any higher version otherwise.
 */
export const resolveEnginesNode = (
  currentEnginesNode,
  minNodeMajor,
  hasEnvs,
) => {
  const major = legacyMajors.includes(String(minNodeMajor))
    ? maintenanceLTS
    : String(minNodeMajor);
  const minVersion = minVersionForMajor(major);
  if (!minVersion) {
    throw new Error(`Invalid min node version: ${minNodeMajor}`);
  }

  const currentMinVersion = getMinVersion(currentEnginesNode);
  if (
    currentMinVersion &&
    semver.gt(currentMinVersion, minVersion) &&
    (!hasEnvs || semver.major(currentMinVersion) === Number(major))
  ) {
    return currentEnginesNode;
  }

  return enginesNodeForMajor.get(major);
};

/**
 * Updates "@types/node" when it is lower than engines.node min major.
 * Never adds it, never lowers devDependencies. A pinned devDependency stays
 * pinned (check-package-dependencies/require-pinned-versions), with the
 * pob-dependencies version when it satisfies the min major.
 */
export const updateTypesNodeFromEngines = (pkg) => {
  const minMajor = getMinMajor(pkg.engines?.node);
  if (minMajor === undefined) return;
  const range = `>=${minMajor}.0.0`;

  if (pkg.dependencies?.["@types/node"]) {
    pkg.dependencies["@types/node"] = range;
  }

  const currentDevVersion = pkg.devDependencies?.["@types/node"];
  if (currentDevVersion) {
    const currentMinMajor = getMinMajor(currentDevVersion);
    if (currentMinMajor !== undefined && currentMinMajor < minMajor) {
      const pinnedVersion = pobDependencies["@types/node"];
      pkg.devDependencies["@types/node"] =
        semver.valid(currentDevVersion) &&
        semver.major(pinnedVersion) >= minMajor
          ? pinnedVersion
          : range;
    }
  }
};

/**
 * Sets engines.node from pob envs, then keeps "@types/node" in sync with it.
 */
export const updateNodeEngines = (pkg, { onlyLatestLTS } = {}) => {
  const envs = pkg.pob?.envs || pkg.pob?.babelEnvs;
  const hasTargetNode = envs?.some((env) => env.target === "node");

  if (!pkg.engines) pkg.engines = {};

  if (hasTargetNode || !envs) {
    pkg.engines.node = resolveEnginesNode(
      pkg.engines.node,
      getEnvsMinNodeMajor(envs, onlyLatestLTS),
      !!envs,
    );

    updateTypesNodeFromEngines(pkg);
  } else {
    packageUtils.removeDependencies(pkg, ["@types/node"]);
    packageUtils.removeDevDependencies(pkg, ["@types/node"]);

    // Supports oldest current or active LTS version of node
    const enginesNode = enginesNodeForMajor.get(
      onlyLatestLTS ? latestLTS : maintenanceLTS,
    );

    if (
      !pkg.engines.node ||
      semver.lte(
        semver.minVersion(pkg.engines.node),
        semver.minVersion(enginesNode),
      )
    ) {
      pkg.engines.node = enginesNode;
    }
  }
};
