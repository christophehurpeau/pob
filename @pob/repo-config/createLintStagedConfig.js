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
const workspaces = pkg.workspaces || false;

const getSrcDirectories = () => {
  if (workspaces) {
    return `{${workspaces.join(',')}}/{src,lib}`;
  }

  return '{src,lib}';
};

module.exports = function createLintStagedConfig() {
  const srcDirectories = getSrcDirectories();

  return {
    [`{yarn.lock,package.json${
      workspaces
        ? `,${workspaces
            .map((workspacePath) => `${workspacePath}/package.json`)
            .join(',')}`
        : ''
    }}`]: (filenames) =>
      [
        yarnMajorVersion < 2 ? 'yarn --prefer-offline' : 'yarn',
        yarnMajorVersion < 2 ? 'yarn-deduplicate' : undefined,
        `git add yarn.lock${yarnMajorVersion}` >= 2 ? ' .yarn .yarnrc.yml' : '',
      ].filter(Boolean),
    [`{.eslintrc.json,package.json${
      workspaces
        ? `,${workspaces
            .map(
              (workspacePath) =>
                `${workspacePath}/{.eslintrc.json,package.json}`
            )
            .join(',')}`
        : ''
    },${srcDirectories}/**/*.json}`]: [
      'prettier --parser json --write',
      'git add',
    ],
    [`{.storybook,${srcDirectories}}/**/*.css`]: [
      'prettier --parser css --write',
      'git add',
    ],

    [`${srcDirectories}/**/*.{js,ts,tsx}`]: ['eslint --fix --quiet', 'git add'],
    '{scripts,config,.storyboook}/*.js': ['eslint --fix --quiet', 'git add'],
  };
};
