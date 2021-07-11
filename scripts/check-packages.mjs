import { createCheckPackageWithWorkspaces } from 'check-package-dependencies';

createCheckPackageWithWorkspaces()
  .checkRecommended({
    isLibrary: () => true,
    directDuplicateDependenciesOnlyWarnsFor: ['semver'],
  })
  .forRoot((rootPackageCheck) => {
    return rootPackageCheck.checkExactVersions();
  })
  .for('pob-lcov-reporter', (pkgCheck) => {
    return pkgCheck.checkSatisfiesVersionsFromDependency('@jest/reporters', {
      dependencies: ['istanbul-reports'],
    });
  });
