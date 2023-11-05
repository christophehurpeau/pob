import { createCheckPackageWithWorkspaces } from 'check-package-dependencies';

await createCheckPackageWithWorkspaces({
  isLibrary: () => true,
})
  .checkRecommended({
    onlyWarnsForInMonorepoPackagesDependencies: {
      'pob-babel': {
        '*': { duplicateDirectDependency: ['semver'] },
      },
      'pob-dependencies': {
        '*': {
          duplicateDirectDependency: ['semver'],
          // invalidPeerDependencyVersion: ['rollup'],
        },
      },
    },
  })
  .forRoot((rootPackageCheck) => {
    return rootPackageCheck.checkExactVersions();
  })
  .for('pob', (pkgCheck) => {
    return pkgCheck.checkSatisfiesVersionsFromDependency('yeoman-environment', {
      dependencies: ['mem-fs', 'mem-fs-editor'],
    });
  })
  .run();
