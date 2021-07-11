#!/usr/bin/env node --experimental-json-modules

import { spawnSync } from 'child_process';
import path from 'path';
import argv from 'minimist-argv';
import rollup from 'rollup';
import semver from 'semver';
import pkg from '../package.json';

const requiredRollupVersion = pkg.peerDependencies.rollup.slice(1);

if (semver.lt(rollup.VERSION, requiredRollupVersion)) {
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
const configPath = path.resolve('rollup.config.mjs');

const { error } = spawnSync('yarn', ['rollup', '--config', configPath], {
  stdio: 'inherit',
});
if (error) {
  throw error;
}
