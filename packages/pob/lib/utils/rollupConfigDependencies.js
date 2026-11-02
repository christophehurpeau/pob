const escapeRegExp = (value) => value.replaceAll(/[$()*+.?[\\\]^{|}]/g, "\\$&");

/**
 * Names of the workspace packages imported by a rollup config (e.g. a rollup
 * plugin): the root rollup config loads them from their build output, so
 * they must be built before it runs. Only packages with a build script.
 */
export const getRollupConfigDependencies = (packages, rollupConfigContents) =>
  packages
    .filter((pkg) => {
      if (!pkg.scripts?.build) return false;
      const importRegex = new RegExp(
        `from\\s+["']${escapeRegExp(pkg.name)}(?:/[^"']*)?["']`,
      );
      return rollupConfigContents.some((content) => importRegex.test(content));
    })
    .map((pkg) => pkg.name);
