/* eslint-disable global-require */
/* eslint-disable unicorn/prefer-optional-catch-binding */

'use strict';

const { spawnSync } = require('child_process');

let createHuskyConfig;

try {
  createHuskyConfig = require('./@pob/root/createHuskyConfig');
} catch (err) {
  spawnSync('yarn', ['install'], { stdio: 'inherit' });
  createHuskyConfig = require('./@pob/root/createHuskyConfig');
}

module.exports = createHuskyConfig();
