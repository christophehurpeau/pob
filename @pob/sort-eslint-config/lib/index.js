'use strict';

const sortObject = require('@pob/sort-object');

module.exports = function sortEslintConfig(config) {
  const sortedConfig = sortObject(config, [
    'root',
    'parser',
    'parserOptions',
    'plugins',
    'extends',
    'env',
    'globals',
    'settings',
    'ignorePatterns',
    'rules',
    'overrides',
  ]);

  if (sortedConfig.overrides) {
    sortedConfig.overrides.forEach((override, index) => {
      sortedConfig.overrides[index] = sortObject(override, [
        'files',
        'env',
        'globals',
        'settings',
        'extends',
        'rules',
      ]);
    });
  }

  return sortedConfig;
};
