'use strict';

const fs = require('fs');
const sortPkg = require('@pob/sort-pkg');
const prettier = require('prettier');

module.exports = function prettyPkg(pkg, prettierOptions) {
  if (typeof pkg === 'string') {
    pkg = JSON.parse(pkg);
    if (typeof pkg !== 'object') {
      throw new TypeError(
        'Invalid package: not an object after parsing string',
      );
    }
  } else if (typeof pkg !== 'object') {
    throw new TypeError('expected pkg to be object or string');
  }

  sortPkg(pkg);
  return prettier.format(JSON.stringify(pkg, undefined, 2), {
    filepath: 'package.json',
    printWidth: 80,
    ...prettierOptions,
  });
};

module.exports.writeSync = (pkg, path, prettierOptions) => {
  const string = module.exports(pkg);
  fs.writeFileSync(path, string, 'utf-8');
};

module.exports.overrideSync = (path, prettierOptions) => {
  const pkg = fs.readFileSync(path, 'uft-8');
  return module.exports.writeSync(pkg, path, prettierOptions);
};
