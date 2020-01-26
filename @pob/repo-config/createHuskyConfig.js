'use strict';

const path = require('path');

// eslint-disable-next-line import/no-dynamic-require
const pkg = require(path.resolve('package.json'));

const shouldRunTest = () => pkg.scripts && pkg.scripts.test;

module.exports = () => {
  // Note that since version 4 husky greps the config file
  // to check if hook name is present, so you should also list them there
  const hooks = {
    'commit-msg': 'commitlint -e $HUSKY_GIT_PARAMS',
    'pre-commit': 'lint-staged',
    'post-checkout': 'yarnhook',
    'post-merge': 'yarnhook',
    'post-rewrite': 'yarnhook',
  };

  if (shouldRunTest()) hooks['pre-push'] = 'cross-env CI=true yarn test';

  return {
    hooks,
  };
};
