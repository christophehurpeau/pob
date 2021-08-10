import fs from 'fs';
import prettyPkg from '@pob/pretty-pkg';
import semver from 'semver';
import { pkgPath, requireIfPossible } from './helper.cjs';

let madeModifications = false;

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

Object.keys(pkg.devDependencies).forEach((key) => {
  const depPkg = requireIfPossible(`${key}/package.json`);
  if (!depPkg.peerDependencies) return;
  Object.keys(depPkg.peerDependencies).forEach((peerDep) => {
    const peerDepRange = depPkg.peerDependencies[peerDep];
    if (!pkg.devDependencies[peerDep]) {
      console.warn(
        `Missing peerdep "${peerDep}" from "${depPkg.name}", asking for "${peerDepRange}"`,
      );
    } else if (!semver.satisfies(pkg.devDependencies[peerDep], peerDepRange)) {
      const newVersion = semver.minVersion(peerDepRange).version;
      if (semver.lt(newVersion, pkg.devDependencies[peerDep])) {
        console.warn(
          `Incompatible peerdep "${peerDep}" required version "${newVersion}" from "${depPkg.name}", asking for ${peerDepRange}`,
        );
      } else {
        console.log(
          `update "${peerDep}" to "${newVersion}" because ${
            !pkg.devDependencies[peerDep]
              ? 'it was added in'
              : `version "${pkg.devDependencies[peerDep]}" doesn't match peer dependency in`
          } ${depPkg.name} (${depPkg.version})`,
        );
        pkg.devDependencies[peerDep] = newVersion;
        madeModifications = true;
      }
    }
  });
});

if (madeModifications) {
  prettyPkg.writeSync(pkg, pkgPath);
}
