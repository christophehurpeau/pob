// Packages exempt from the minimum release age, so a repository can use a
// release of pob or of its own dependencies right away. Lockstep releases are
// listed together: nightingale-logger pins nightingale-levels and
// nightingale-types to the version published with it.
const otherPackages = [
  "pob",
  "pob-dependencies",
  "check-package-dependencies",
  "alouette",
  "alouette-icons",
  "nightingale",
  "nightingale-logger",
  "nightingale-levels",
  "nightingale-types",
];

// bun matches exact names only (no glob): every published @pob package,
// including @pob/eslint-config-typescript, no longer in this repository.
const pobScopePackages = [
  "@pob/codemods",
  "@pob/commitlint-config",
  "@pob/esbuild",
  "@pob/eslint-config",
  "@pob/eslint-config-typescript",
  "@pob/eslint-config-typescript-react",
  "@pob/eslint-plugin",
  "@pob/pretty-pkg",
  "@pob/rollup",
  "@pob/rollup-esbuild",
  "@pob/rollup-typescript",
  "@pob/root",
  "@pob/sort-object",
  "@pob/sort-pkg",
  "@pob/version",
];

/** pnpm `minimumReleaseAgeExclude`, yarn `npmPreapprovedPackages` (globs) */
export const minimumReleaseAgeExcludePatterns = ["@pob/*", ...otherPackages];

/** bun `minimumReleaseAgeExcludes` (exact names) */
export const minimumReleaseAgeExcludeNames = [
  ...pobScopePackages,
  ...otherPackages,
];
