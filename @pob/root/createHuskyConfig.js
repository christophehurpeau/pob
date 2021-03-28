/* eslint-disable no-console */

'use strict';

const fs = require('fs');
const path = require('path');
const semver = require('semver');
const whichPmRuns = require('which-pm-runs');

const pm =
  whichPmRuns() ||
  (fs.existsSync('package-lock.json') ? { name: 'npm' } : undefined);

if (pm.name !== 'yarn' && pm.name !== 'npm') {
  console.error(
    `Package manager not supported: ${pm.name}. Please run with yarn or npm !`,
  );
  process.exit(1);
}

const yarnMajorVersion = pm.name === 'yarn' && semver.major(pm.version);
const isYarnWithOfflineCache = pm.name === 'yarn' && yarnMajorVersion >= 2;

// eslint-disable-next-line import/no-dynamic-require
const pkg = require(path.resolve('package.json'));

const shouldRunTest = () => pkg.scripts && pkg.scripts.test;
const shouldRunChecks = () => pkg.scripts && pkg.scripts.checks;

module.exports = () => {
  // Note that since version 4 husky greps the config file
  // to check if hook name is present, so you should also list them there
  const hooks = {
    'commit-msg': 'commitlint -e $HUSKY_GIT_PARAMS',
    'pre-commit': 'lint-staged',
  };

  if (!isYarnWithOfflineCache) {
    Object.assign(hooks, {
      'post-checkout': 'yarnhook',
      'post-merge': 'yarnhook',
      'post-rewrite': 'yarnhook',
    });
  }

  if (shouldRunTest()) {
    hooks['pre-push'] = `${
      !isYarnWithOfflineCache ? 'cross-env ' : ''
    }CI=true ${pm.name} test`;
  }

  if (shouldRunChecks()) {
    if (hooks['pre-push']) {
      hooks['pre-push'] += ' && ';
    } else {
      hooks['pre-push'] = '';
    }

    hooks['pre-push'] += `${pm.name} run checks`;
  }

  return {
    hooks,
  };
};
