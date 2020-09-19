/* eslint-disable complexity */

'use strict';

const sortObject = require('@pob/sort-object');

module.exports = function sortPkg(pkg) {
  sortObject(pkg, [
    'name',
    'private',
    'version',
    'description',
    'keywords',
    'author',
    'contributors',
    'license',
    'repository',
    'homepage',
    'bugs',
    'preferGlobal',
    'engines',
    'engineStrict',
    'os',
    'cpu',
    'publishConfig',
    'workspaces',
    'browserslist',
    'main',
    'types',
    'typesVersions',
    'jsnext:main',
    'module',
    'module-dev',
    'browser',
    'browser-dev',
    'browserify',
    'exports',
    'module:node',
    'module:node-dev',
    'module:browser',
    'module:browser-dev',
    'module:modern-browsers',
    'module:modern-browsers-dev',
    'module:aliases-node',
    'module:aliases-node-dev',
    'module:aliases-browser',
    'module:aliases-browser-dev',
    'module:aliases-modern-browsers',
    'module:aliases-modern-browsers-dev',
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
    'peerDependencies',
    'peerDependenciesMeta',
    'devPeerDependencies',
    'dependencies',
    'devDependencies',
    'bundledDependencies',
    'bundleDependencies',
    'optionalDependencies',
    'resolutions',
  ]);

  if (pkg.scripts) sortObject(pkg.scripts);
  if (pkg.peerDependencies) sortObject(pkg.peerDependencies);
  if (pkg.devPeerDependencies) sortObject(pkg.devPeerDependencies);
  if (pkg.dependencies) sortObject(pkg.dependencies);
  if (pkg.devDependencies) sortObject(pkg.devDependencies);
  if (pkg.bundledDependencies) sortObject(pkg.bundledDependencies);
  if (pkg.bundleDependencies) sortObject(pkg.bundleDependencies);
  if (pkg.optionalDependencies) sortObject(pkg.optionalDependencies);
  if (pkg.resolutions) sortObject(pkg.resolutions);

  return pkg;
};
