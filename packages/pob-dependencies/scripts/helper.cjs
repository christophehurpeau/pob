'use strict';

exports.pkgPath = require.resolve('../package.json');

exports.requireIfPossible = (packageJsonPath) => {
  try {
    return require(packageJsonPath);
  } catch (err) {
    console.error(`Failed to require ${packageJsonPath}`);
    console.error(err.message);
    return {};
  }
};
