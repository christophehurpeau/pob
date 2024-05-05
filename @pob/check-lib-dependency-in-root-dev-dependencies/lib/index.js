/* eslint-disable import/no-dynamic-require */
import { createRequire } from "node:module";

export default function checkLibDependencyInRootDevDependencies(
  dependencyPackage,
) {
  const require = createRequire(import.meta.url);
  let pluginRootPackage;
  try {
    pluginRootPackage = require(
      require.resolve(`${dependencyPackage.name}/package.json`, {
        paths: [process.cwd()],
      }),
    );
  } catch (error) {
    console.error(
      `It seems the package ${dependencyPackage.name} is not in your devDependencies`,
    );
    throw error;
  }

  if (dependencyPackage.version !== pluginRootPackage.version) {
    throw new Error(
      `Invalid version ${pluginRootPackage.version} of ${dependencyPackage.name}, expected ${dependencyPackage.version}`,
    );
  }
}
