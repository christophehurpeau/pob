#!/usr/bin/env node

'use strict';

const { spawnSync } = require('child_process');
const path = require('path');
const argv = require('minimist-argv');
const rollup = require('rollup');
const semver = require('semver');
const requiredRollupVersion = require('../package.json').peerDependencies.rollup.slice(
  1,
);

if (semver.lt(requiredRollupVersion, rollup.VERSION)) {
  console.error(
    `Invalid rollup version: ${rollup.VERSION}. Expecting >= ${requiredRollupVersion}`,
  );
}

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
