'use strict';

// eslint-disable-next-line import/no-extraneous-dependencies
const jestReporters = require('@jest/reporters/package.json');
const pobLcovReporterPkg = require('../packages/pob-lcov-reporter/package.json');

let hasError = false;

const expectFixedVersion = (pkg, dep, value, expected) => {
  if (value !== expected) {
    console.error(
      `Invalid ${dep} in ${pkg.name}: "${dep}": "${value}" should be "${expected}"`,
    );

    hasError = true;
  }
};

expectFixedVersion(
  pobLcovReporterPkg,
  'istanbul-reports',
  pobLcovReporterPkg.dependencies['istanbul-reports'],
  jestReporters.dependencies['istanbul-reports'],
);

if (hasError) {
  process.exit(1);
}
