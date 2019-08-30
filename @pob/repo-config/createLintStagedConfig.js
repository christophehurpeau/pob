'use strict';

const path = require('path');

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
    }}`]: (filenames) => [
      'yarn --prefer-offline',
      'yarn-deduplicate',
      'git add yarn.lock',
    ],
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
