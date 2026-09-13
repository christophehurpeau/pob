import semver from "semver";
import { latestLTS, maintenanceLTS } from "./nodeVersions.js";
import * as packageUtils from "./package.js";

// 22.18.0 is the version with strip typescript out of experimental status
const minVersionForMajor = new Map([
  ["22", "22.18.0"],
  ["24", "24.14.1"],
  ["26", "26.0.0"],
]);

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
 * Min node major of a range, undefined when missing or not parseable
 * (workspace:*, catalog:, npm: alias...).
 */
export const getMinMajor = (range) => {
  if (!range) return undefined;
  try {
    const minVersion = semver.minVersion(range);
    return minVersion ? semver.major(minVersion) : undefined;
  } catch {
    return undefined;
  }
};

/**
 * engines.node value for a min node major. When envs are not defined, an
 * already higher engines.node is kept.
 */
export const resolveEnginesNode = (
  currentEnginesNode,
  minNodeMajor,
  hasEnvs,
) => {
  const major = legacyMajors.includes(String(minNodeMajor))
    ? maintenanceLTS
    : String(minNodeMajor);
  const minVersion = minVersionForMajor.get(major);
  if (!minVersion) {
    throw new Error(`Invalid min node version: ${minNodeMajor}`);
  }

  if (!hasEnvs) {
    const currentMinMajor = getMinMajor(currentEnginesNode);
    if (currentMinMajor !== undefined && currentMinMajor > Number(major)) {
      return currentEnginesNode;
    }
  }

  return `>=${minVersion}`;
};

/**
 * Updates "@types/node" when it is lower than engines.node min major.
 * Never adds it, never lowers devDependencies.
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
      pkg.devDependencies["@types/node"] = range;
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
    const minVersion = minVersionForMajor.get(
      onlyLatestLTS ? latestLTS : maintenanceLTS,
    );

    if (
      !pkg.engines.node ||
      semver.lt(semver.minVersion(pkg.engines.node), minVersion)
    ) {
      pkg.engines.node = `>=${minVersion}`;
    }
  }
};
