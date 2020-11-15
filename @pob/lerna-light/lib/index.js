#!/usr/bin/env node

'use strict';

const changedCmd = require('@lerna/changed/command');
const cli = require('@lerna/cli');
const execCmd = require('@lerna/exec/command');
const publishCmd = require('@lerna/publish/command');
const runCmd = require('@lerna/run/command');
const versionCmd = require('@lerna/version/command');
const pkg = require('../package.json');

module.exports = function main(argv) {
  const context = {
    lernaVersion: pkg.version,
  };

  return cli()
    .command(changedCmd)
    .command(execCmd)
    .command(publishCmd)
    .command(runCmd)
    .command(versionCmd)
    .parse(argv, context);
};
