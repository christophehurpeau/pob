'use strict';

const {
  createCheckPackageWithWorkspaces,
} = require('../packages/check-package-dependencies');

createCheckPackageWithWorkspaces()
  .checkRecommended({
    isLibrary: () => true,
    directDuplicateDependenciesOnlyWarnsFor: ['semver', 'github-username'],
  })
  .forRoot((rootPackageCheck) => {
    return rootPackageCheck.checkExactVersions();
  })
  .for('pob-lcov-reporter', (pkgCheck) => {
    return pkgCheck.checkSatisfiesVersionsFromDependency('@jest/reporters', {
      dependencies: ['istanbul-reports'],
    });
  });
