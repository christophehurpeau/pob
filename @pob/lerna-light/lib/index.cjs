'use strict';

const cli = require('@lerna/cli');
const versionCmd = require('@lerna/version/command');
const pkg = require('../package.json');

module.exports = function main(argv) {
  const context = {
    lernaVersion: pkg.version,
  };

  return cli().command(versionCmd).parse(argv, context);
};
