#!/usr/bin/env node

'use strict';

const { spawnSync } = require('child_process');
const path = require('path');
const checkDep = require('@pob/check-lib-dependency-in-root-dev-dependencies');
const argv = require('minimist-argv');

checkDep(require('rollup/package.json'));

if (argv.clean !== false) {
  try {
    spawnSync('yarn', ['run', 'clean']);
  } catch (err) {
    console.error(err);
  }
}

// const rollupBin = require.resolve('rollup/dist/bin/rollup');
const configPath = path.resolve('rollup.config.js');

const { error } = spawnSync('yarn', ['rollup', '--config', configPath], {
  stdio: 'inherit',
});
if (error) {
  throw error;
}
