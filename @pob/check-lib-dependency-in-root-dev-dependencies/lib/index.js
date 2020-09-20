/* eslint-disable import/no-dynamic-require */

'use strict';

const checkLibDependencyInRootDevDependencies = (dependencyPackage) => {
  let pluginRootPackage;
  try {
    pluginRootPackage = require(require.resolve(
      `${dependencyPackage.name}/package.json`,
      {
        paths: [process.cwd()],
      },
    ));
  } catch (err) {
    console.error(
      `It seems the package ${dependencyPackage.name} is not in your devDependencies`,
    );
    throw err;
  }

  if (dependencyPackage.version !== pluginRootPackage.version) {
    throw new Error(
      `Invalid version ${pluginRootPackage.version} of ${dependencyPackage.name}, expected ${dependencyPackage.version}`,
    );
  }
};

module.exports = checkLibDependencyInRootDevDependencies;
