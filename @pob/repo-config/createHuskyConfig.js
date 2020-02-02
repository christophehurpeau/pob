/* eslint-disable no-console, unicorn/no-process-exit */

'use strict';

const path = require('path');
const semver = require('semver');
const whichPmRuns = require('which-pm-runs');

const pm = whichPmRuns();

if (pm.name !== 'yarn') {
  console.error(
    `Package manager not supported: ${pm.name}. Please run with yarn !`
  );
  process.exit(1);
}

const yarnMajorVersion = semver.major(pm.version);

// eslint-disable-next-line import/no-dynamic-require
const pkg = require(path.resolve('package.json'));

const shouldRunTest = () => pkg.scripts && pkg.scripts.test;

module.exports = () => {
  // Note that since version 4 husky greps the config file
  // to check if hook name is present, so you should also list them there
  const hooks = {
    'commit-msg': 'commitlint -e $HUSKY_GIT_PARAMS',
    'pre-commit': 'lint-staged',
  };

  if (yarnMajorVersion < 2) {
    Object.assign(hooks, {
      'post-checkout': 'yarnhook',
      'post-merge': 'yarnhook',
      'post-rewrite': 'yarnhook',
    });
  }

  if (shouldRunTest()) hooks['pre-push'] = 'cross-env CI=true yarn test';

  return {
    hooks,
  };
};
