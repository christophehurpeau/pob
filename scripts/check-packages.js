import { createCheckPackageWithWorkspaces } from "check-package-dependencies";

await createCheckPackageWithWorkspaces({
  isLibrary: (pkg) => !["@pob-example/next-app"].includes(pkg.name),
})
  .checkRecommended({
    onlyWarnsForInMonorepoPackagesDependencies: {
      "pob-babel": {
        "*": { duplicateDirectDependency: ["semver"] },
      },
      "pob-dependencies": {
        "*": {
          duplicateDirectDependency: ["semver"],
          // invalidPeerDependencyVersion: ['rollup'],
        },
      },
      pob: {
        "@yeoman/types": {
          missingPeerDependency: ["@types/node"],
        },
      },
    },
  })
  .forRoot((rootPackageCheck) => {
    return rootPackageCheck.checkExactVersions();
  })
  .for("pob", (pkgCheck) => {
    return pkgCheck.checkSatisfiesVersionsFromDependency("yeoman-environment", {
      dependencies: ["mem-fs-editor"],
    });
  })
  .for("pob-dependencies", (pkgCheck) => {
    return pkgCheck.checkIdenticalVersions({
      devDependencies: { vitest: ["@vitest/coverage-v8"] },
    });
  })
  .run();
