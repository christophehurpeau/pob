#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const argv = require('minimist-argv');

if (argv.clean !== false) {
  try {
    fs.rmdirSync(path.resolve('dist'), { recursive: true });
  } catch (err) {
    console.error(err);
  }
}

const rollupBin = require.resolve('rollup/dist/bin/rollup');
const configPath = require.resolve('../rollup.config.js');

const { error } = spawnSync(rollupBin, ['--config', configPath], {
  stdio: 'inherit',
});
if (error) {
  throw error;
}
