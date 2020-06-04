'use strict';

const fs = require('fs');
const path = require('path');
const findup = require('findup-sync');

const lernaJsonPath = findup('lerna.json');

const rootMonorepo = lernaJsonPath ? path.dirname(lernaJsonPath) : undefined;

const getInLernaThings = () => {
  const rootYoConfig = JSON.parse(
    fs.readFileSync(path.resolve(rootMonorepo, '.yo-rc.json'), 'utf-8'),
  );
  const cwd = process.cwd();

  return {
    lernaJsonPath,
    rootPath: rootMonorepo,
    root: rootMonorepo === cwd,
    isRootYarn2:
      rootYoConfig &&
      rootYoConfig.pob &&
      rootYoConfig.pob.project &&
      rootYoConfig.pob.project.yarn2,
    packageJsonPath: path.resolve(rootMonorepo, 'package.json'),
    relative: path.relative(rootMonorepo, cwd),
    rootYoConfig,
    pobConfig: rootYoConfig && rootYoConfig.pob,
    pobMonorepoConfig:
      rootYoConfig && rootYoConfig.pob && rootYoConfig.pob.monorepo,
  };
};

module.exports = !lernaJsonPath ? false : getInLernaThings();
