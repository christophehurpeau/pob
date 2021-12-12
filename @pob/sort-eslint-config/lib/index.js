import sortObject from '@pob/sort-object';

export default function sortEslintConfig(config) {
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
        'extends',
        'env',
        'globals',
        'settings',
        'rules',
      ]);
    });
  }

  return sortedConfig;
}
