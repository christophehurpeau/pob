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
          invalidPeerDependencyVersion: ["mem-fs", "mem-fs-editor"],
          duplicateDirectDependency: ["@types/node"],
        },
        "mem-fs-editor": {
          duplicateDirectDependency: ["@types/node"],
        },
        "yeoman-generator": {
          duplicateDirectDependency: ["@types/node"],
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
  .run();
