'use strict';

const cli = require('@lerna/cli');
const publishCmd = require('@lerna/publish/command');
const versionCmd = require('@lerna/version/command');
const pkg = require('../package.json');

module.exports = function main(argv) {
  const context = {
    lernaVersion: pkg.version,
  };

  return cli().command(publishCmd).command(versionCmd).parse(argv, context);
};
