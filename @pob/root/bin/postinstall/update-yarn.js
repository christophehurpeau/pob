'use strict';

const { execSync } = require('child_process');
const semver = require('semver');

module.exports = function updateYarn({ pkg, pm }) {
  if (pm.name !== 'yarn' || !pm.version) return;

  if (semver.lt(pm.version, '3.0.0')) {
    // Upgrade from yarn 1
    if (semver.lt(pm.version, '2.0.0')) {
      execSync('yarn set version berry');
    }
    execSync('yarn set version latest');
    execSync('yarn install');
  }
};
