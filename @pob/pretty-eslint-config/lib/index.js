'use strict';

const fs = require('fs');
const sortEslintConfig = require('@pob/sort-eslint-config');
const prettier = require('prettier');

module.exports = function prettyEslintConfig(eslintConfig, prettierOptions) {
  if (typeof eslintConfig === 'string') {
    eslintConfig = JSON.parse(eslintConfig);
    if (typeof eslintConfig !== 'object') {
      throw new TypeError(
        'Invalid eslint config: not an object after parsing string',
      );
    }
  } else if (typeof eslintConfig !== 'object') {
    throw new TypeError('expected eslint config to be object or string');
  }

  if (typeof prettierOptions === 'string') {
    throw new TypeError(
      `Please import "${prettierOptions}" and pass it as the second argument of prettyPkg`,
    );
  }

  sortEslintConfig(eslintConfig);
  return prettier.format(JSON.stringify(eslintConfig, undefined, 2), {
    filepath: '.eslintrc.json',
    printWidth: 80,
    ...prettierOptions,
  });
};

module.exports.writeSync = function writeSync(
  eslintConfig,
  path,
  prettierOptions,
) {
  const string = module.exports(eslintConfig, prettierOptions);
  fs.writeFileSync(path, string, 'utf-8');
};

module.exports.overrideSync = function overrideSync(path, prettierOptions) {
  const eslintConfig = fs.readFileSync(path, 'utf-8');
  return module.exports.writeSync(eslintConfig, path, prettierOptions);
};
