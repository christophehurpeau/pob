'use strict';

const fs = require('fs');
const sortPkg = require('@pob/sort-pkg');
const prettier = require('prettier');

module.exports = function prettyPkg(pkg, prettierOptions = pkg.prettier) {
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

  if (typeof prettierOptions === 'string') {
    throw new TypeError(
      `Please import "${prettierOptions}" and pass it as the second argument of prettyPkg`,
    );
  }

  sortPkg(pkg);
  return prettier.format(JSON.stringify(pkg, undefined, 2), {
    filepath: 'package.json',
    printWidth: 80,
    ...prettierOptions,
  });
};

module.exports.writeSync = function writeSync(pkg, path, prettierOptions) {
  const string = module.exports(pkg, prettierOptions);
  fs.writeFileSync(path, string, 'utf-8');
};

module.exports.overrideSync = function overrideSync(path, prettierOptions) {
  const pkg = fs.readFileSync(path, 'utf-8');
  return module.exports.writeSync(pkg, path, prettierOptions);
};
