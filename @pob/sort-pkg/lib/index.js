/* eslint-disable complexity */

import sortObject from "@pob/sort-object";

export default function sortPkg(pkg) {
  sortObject(pkg, [
    /* information on the package */
    "name",
    "private",
    "version",
    "description",
    "keywords",
    "author",
    "authors",
    "contributors",
    "license",
    "repository",
    "homepage",
    "bugs",
    /* package type */
    "type",
    /* corepack */ "packageManager",
    /* package env and configuration */
    "engines",
    "engineStrict",
    "os",
    "cpu",
    "libc",
    "sideEffects",
    "config",
    /* workspaces */
    "workspaces",
    /* exports */
    "bin",
    "main",
    "types",
    "typesVersions",
    "jsnext:main",
    "module",
    "browser",
    "browserify",
    "react-native", // react-native doesnt use exports field in stable yet
    "exports",
    "style", // https://stackoverflow.com/questions/32037150/style-field-in-package-json
    /* documentation */
    "man",
    /* publish */
    "publishConfig",
    "directories",
    "files",
    /* scripts */
    "scripts",
    /* dependencies configs */
    "babel",
    "browserslist",
    "commitlint",
    "eslintConfig",
    "husky",
    "jest",
    "lint-staged",
    "pob",
    "prettier",
    "stylelint",
    /* dependencies */
    "overrides",
    "overridesExplained",
    "resolutions",
    "resolutionsExplained",
    "peerDependencies",
    "peerDependenciesMeta",
    "devPeerDependencies",
    "dependencies",
    "devDependencies",
    "dependenciesMeta",
    "optionalDependencies",
    "bundledDependencies",
    "bundleDependencies",
  ]);

  if (pkg.pob) sortObject(pkg.pob);
  if (pkg.scripts) sortObject(pkg.scripts);
  if (pkg.overrides) sortObject(pkg.overrides);
  if (pkg.overridesExplained) sortObject(pkg.overridesExplained);
  if (pkg.resolutions) sortObject(pkg.resolutions);
  if (pkg.resolutionsExplained) sortObject(pkg.resolutionsExplained);
  if (pkg.peerDependencies) sortObject(pkg.peerDependencies);
  if (pkg.devPeerDependencies) sortObject(pkg.devPeerDependencies);
  if (pkg.dependencies) sortObject(pkg.dependencies);
  if (pkg.devDependencies) sortObject(pkg.devDependencies);
  if (pkg.bundledDependencies) sortObject(pkg.bundledDependencies);
  if (pkg.bundleDependencies) sortObject(pkg.bundleDependencies);
  if (pkg.optionalDependencies) sortObject(pkg.optionalDependencies);

  return pkg;
}
