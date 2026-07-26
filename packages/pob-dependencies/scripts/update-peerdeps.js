import fs from "node:fs";
import prettyPkg from "@pob/pretty-pkg";
import semver from "semver";
import { pkgPath, requireIfPossible } from "./helper.cjs";

let madeModifications = false;

const pkg = JSON.parse(fs.readFileSync(pkgPath));

const npmAliasRegex = /^npm:.+@(?<version>[^@]+)$/;

// "typescript" is installed through an npm alias, its version cannot be read
// directly from the dependency value.
const getVersion = (dependencyValue) =>
  npmAliasRegex.exec(dependencyValue)?.groups.version ?? dependencyValue;

Object.keys(pkg.devDependencies).forEach((key) => {
  const depPkg = requireIfPossible(`${key}/package.json`);
  if (!depPkg.peerDependencies) return;
  Object.keys(depPkg.peerDependencies).forEach((peerDep) => {
    const peerDepRange = depPkg.peerDependencies[peerDep];
    const currentValue = pkg.devDependencies[peerDep];
    if (!currentValue) {
      console.warn(
        `Missing peerdep "${peerDep}" from "${depPkg.name}", asking for "${peerDepRange}"`,
      );
      return;
    }
    const currentVersion = getVersion(currentValue);
    if (semver.satisfies(currentVersion, peerDepRange)) return;

    const newVersion = semver.minVersion(peerDepRange).version;
    if (semver.lt(newVersion, currentVersion)) {
      console.warn(
        `Incompatible peerdep "${peerDep}" required version "${newVersion}" from "${depPkg.name}", asking for ${peerDepRange}`,
      );
    } else if (currentValue !== currentVersion) {
      console.warn(
        `Aliased peerdep "${peerDep}" ("${currentValue}") requires version "${newVersion}" from "${depPkg.name}", asking for ${peerDepRange}. Update it manually.`,
      );
    } else {
      console.log(
        `update "${peerDep}" to "${newVersion}" because version "${currentValue}" doesn't match peer dependency in ${depPkg.name} (${depPkg.version})`,
      );
      pkg.devDependencies[peerDep] = newVersion;
      madeModifications = true;
    }
  });
});

if (madeModifications) {
  prettyPkg.writeSync(pkg, pkgPath);
}
