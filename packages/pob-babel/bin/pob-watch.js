#!/usr/bin/env node

import { spawnSync } from 'child_process';
import path from 'path';
import argv from 'minimist-argv';
import { VERSION as rollupVersion } from 'rollup';
import semver from 'semver';
import { pkg } from './helper.cjs';

const requiredRollupVersion = pkg.peerDependencies.rollup.slice(1);

if (semver.lt(rollupVersion, requiredRollupVersion)) {
  console.error(
    `Invalid rollup version: ${rollupVersion}. Expecting >= ${requiredRollupVersion}`,
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

const { error } = spawnSync(
  'yarn',
  ['rollup', '--watch', '--config', configPath],
  {
    stdio: 'inherit',
  },
);
if (error) {
  throw error;
}
