/* eslint-disable no-console, unicorn/no-process-exit */

'use strict';

const path = require('path');
const semver = require('semver');
const whichPmRuns = require('which-pm-runs');

const pm = whichPmRuns();

if (pm.name !== 'yarn') {
  console.error(
    `Package manager not supported: ${pm.name}. Please run with yarn !`,
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
    }}`]: (filenames) => {
      const packagejsonFilenames = filenames.filter((filename) =>
        filename.endsWith('.json'),
      );

      return [
        yarnMajorVersion < 2 ? 'yarn --prefer-offline' : 'yarn',
        yarnMajorVersion < 2 ? 'yarn-deduplicate' : 'yarn dedupe',
        yarnMajorVersion < 2 ? 'yarn --prefer-offline' : undefined,
        packagejsonFilenames.length === 0
          ? undefined
          : `prettier --write "${packagejsonFilenames.join('" "')}"`,
        `git add yarn.lock${yarnMajorVersion >= 2 ? ' .yarn .yarnrc.yml' : ''}`,
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
