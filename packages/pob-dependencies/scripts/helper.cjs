'use strict';

exports.pkgPath = require.resolve('../package.json');

exports.requireIfPossible = (packageJsonPath) => {
  try {
    return require(packageJsonPath);
  } catch (error) {
    console.error(`Failed to require ${packageJsonPath}`);
    console.error(error.message);
    return {};
  }
};
