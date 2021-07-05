'use strict';

const fs = require('fs');
const path = require('path');
const semver = require('semver');

module.exports = function installGithubWorkflows({ pkg, pm }) {
  const yarnMajorVersion = pm.name === 'yarn' && semver.major(pm.version);
  const isYarnBerry = pm.name === 'yarn' && yarnMajorVersion >= 2;

  if (!isYarnBerry) return;

  fs.writeFileSync(
    path.resolve('.github/workflows/push-renovate-prettier.yml'),
    fs.readFileSync(
      path.resolve(
        __dirname,
        '../../github-workflows/push-renovate-prettier.yml',
      ),
    ),
  );
};
