'use strict';

const fs = require('fs');
const path = require('path');
const semver = require('semver');
const whichPmRuns = require('which-pm-runs');

const pm =
  whichPmRuns() ||
  (fs.existsSync('package-lock.json') ? { name: 'npm' } : undefined);

if (pm.name !== 'yarn' && pm.name !== 'npm') {
  throw new Error(
    `Package manager not supported: ${pm.name}. Please run with yarn or npm !`,
  );
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
          : `pretty-pkg "${packagejsonFilenames.join('" "')}"`,
        `git add ${lockfile}${
          pm.name === 'yarn' && yarnMajorVersion >= 2
            ? ' .yarn .yarnrc.yml'
            : ''
        }`,
      ].filter(Boolean);
    },
    '!(package|package-lock|.eslintrc).json': ['prettier --write'],
    '.eslintrc.json': ['pretty-eslint-config'],
    [`{scripts,config,${srcDirectories}}/**/*.{yml,yaml,md}`]: [
      'prettier --write',
    ],
    './*.{yml,yaml,md}': ['prettier --write'],
    [`${srcDirectories}/**/*.{js,ts,tsx}`]: [
      'prettier --write',
      'eslint --fix --quiet',
    ],
    '{scripts,config,.storyboook}/**/*.{js,mjs,cjs}': [
      'prettier --write',
      'eslint --fix --quiet',
    ],
    [`{.storybook,${srcDirectories}}/**/*.css`]: [
      'prettier --parser css --write',
    ],
  };
};
