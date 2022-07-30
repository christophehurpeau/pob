import { createCheckPackageWithWorkspaces } from 'check-package-dependencies';

await createCheckPackageWithWorkspaces()
  .checkRecommended({
    isLibrary: () => true,
    onlyWarnsForInMonorepoPackagesDependencies: {
      'pob-babel': {
        '*': { duplicateDirectDependency: ['semver'] },
      },
      'pob-dependencies': {
        '*': { duplicateDirectDependency: ['semver'] },
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
