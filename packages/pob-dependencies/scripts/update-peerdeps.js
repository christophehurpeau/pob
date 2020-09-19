'use strict';

const fs = require('fs');
const prettyPkg = require('@pob/pretty-pkg');
const semver = require('semver');

const pkgPath = require.resolve('../package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

let madeModifications = false;

Object.keys(pkg.devDependencies).forEach((key) => {
  if (key === 'typedoc-plugin-lerna-packages') return;
  const depPkg = require(`${key}/package.json`);
  if (!depPkg.peerDependencies) return;
  Object.keys(depPkg.peerDependencies).forEach((peerDep) => {
    const peerDepRange = depPkg.peerDependencies[peerDep];
    if (
      !pkg.devDependencies[peerDep] ||
      !semver.satisfies(pkg.devDependencies[peerDep], peerDepRange)
    ) {
      const newVersion = semver.minVersion(peerDepRange).version;
      console.log(
        `update ${peerDep} to ${newVersion} because ${
          !pkg.devDependencies[peerDep]
            ? 'it was added in'
            : `version ${pkg.devDependencies[peerDep]} doesn't match peer dependency in`
        } ${depPkg.name} (${depPkg.version})`,
      );
      pkg.devDependencies[peerDep] = newVersion;
      madeModifications = true;
    }
  });
});

if (madeModifications) {
  prettyPkg.writeSync(pkg, pkgPath);
}
