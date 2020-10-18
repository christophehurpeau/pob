/* eslint-disable no-console, unicorn/no-process-exit */

'use strict';

const fs = require('fs');
const path = require('path');
const semver = require('semver');
const whichPmRuns = require('which-pm-runs');

const pm =
  whichPmRuns() || fs.existsSync('package-lock.json')
    ? { name: 'npm' }
    : undefined;

if (pm.name !== 'yarn' && pm.name !== 'npm') {
  console.error(
    `Package manager not supported: ${pm.name}. Please run with yarn or npm !`,
  );
  process.exit(1);
}
const yarnMajorVersion = pm.name === 'yarn' && semver.major(pm.version);
const lockfile = pm.name === 'yarn' ? 'yarn.lock' : 'package-lock.json';

// eslint-disable-next-line import/no-dynamic-require
const pkg = require(path.resolve('package.json'));
const workspaces = pkg.workspaces || false;

const getSrcDirectories = () => {
  if (workspaces) {
    return `{${workspaces.join(',')}}/{src,lib}`;
  }

  return '{src,lib}';
};

const generateInstallAndDedupe = () => {
  if (pm.name === 'npm') {
    return ['npm install', 'npm dedupe'];
  }

  if (yarnMajorVersion < 2) {
    return [
      'yarn --prefer-offline',
      'yarn-deduplicate',
      'yarn --prefer-offline',
    ];
  }

  return ['yarn', 'yarn dedupe'];
};

module.exports = function createLintStagedConfig() {
  const srcDirectories = getSrcDirectories();

  const installAndDedupe = generateInstallAndDedupe();

  return {
    [`{${lockfile},package.json${
      workspaces
        ? `,${workspaces
            .map((workspacePath) => `${workspacePath}/package.json`)
            .join(',')}`
        : ''
    }}`]: (filenames) => {
      const packagejsonFilenames = filenames.filter((filename) =>
        filename.endsWith('.json'),
      );

      return [
        ...installAndDedupe,
        packagejsonFilenames.length === 0
          ? undefined
          : `prettier --write "${packagejsonFilenames.join('" "')}"`,
        `git add ${lockfile}${
          pm.name === 'yarn' && yarnMajorVersion >= 2
            ? ' .yarn .yarnrc.yml'
            : ''
        }`,
      ].filter(Boolean);
    },
    [`{*.json${
      workspaces
        ? `,${workspaces
            .map((workspacePath) => `${workspacePath}/*.json`)
            .join(',')}`
        : ''
    }}`]: (filenames) => {
      const filteredFilenames = filenames.filter(
        (name) => !name.endsWith('/package.json'),
      );
      if (filteredFilenames.length === 0) return [];
      return [`prettier --write ${filteredFilenames.join(' ')}`];
    },
    [`{.storybook,${srcDirectories}}/**/*.css`]: [
      'prettier --parser css --write',
    ],

    [`${srcDirectories}/**/*.{js,ts,tsx}`]: ['eslint --fix --quiet'],
    '{scripts,config,.storyboook}/*.js': ['eslint --fix --quiet'],
  };
};
