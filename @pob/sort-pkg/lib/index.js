/* eslint-disable complexity */

import sortObject from '@pob/sort-object';

export default function sortPkg(pkg) {
  sortObject(pkg, [
    'name',
    'private',
    'version',
    'description',
    'keywords',
    'author',
    'authors',
    'contributors',
    'license',
    'repository',
    'homepage',
    'bugs',
    'preferGlobal',
    'type',
    'engines',
    'engineStrict',
    'os',
    'cpu',
    /* yarn berry */ 'packageManager',
    'publishConfig',
    'workspaces',
    'browserslist',
    'main',
    'types',
    'typesVersions',
    'jsnext:main',
    'module',
    'browser',
    'browserify',
    'exports',
    'sideEffects',
    'config',
    'style',
    'bin',
    'man',
    'directories',
    'files',
    'scripts',
    'husky',
    'lint-staged',
    'babel',
    'prettier',
    'commitlint',
    'eslintConfig',
    'stylelint',
    'jest',
    'pob',
    'resolutions',
    'resolutionsExplained',
    'peerDependencies',
    'peerDependenciesMeta',
    'devPeerDependencies',
    'dependencies',
    'devDependencies',
    'dependenciesMeta',
    'optionalDependencies',
    'bundledDependencies',
    'bundleDependencies',
  ]);

  if (pkg.scripts) sortObject(pkg.scripts);
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
