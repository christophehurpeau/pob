'use strict';

const path = require('path');
const findup = require('findup-sync');

const lernaJsonPath = findup('lerna.json');

const rootMonorepo = lernaJsonPath ? path.dirname(lernaJsonPath) : undefined;

module.exports = !lernaJsonPath
  ? false
  : {
      lernaJsonPath,
      rootPath: rootMonorepo,
      root: rootMonorepo === process.cwd(),
      packageJsonPath: path.resolve(rootMonorepo, 'package.json'),
    };
