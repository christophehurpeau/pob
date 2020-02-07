'use strict';

const fs = require('fs');
const path = require('path');
const findup = require('findup-sync');

const lernaJsonPath = findup('lerna.json');

const rootMonorepo = lernaJsonPath ? path.dirname(lernaJsonPath) : undefined;

const getInLernaThings = () => {
  const rootYoConfig = JSON.parse(
    fs.readFileSync(path.resolve(rootMonorepo, '.yo-rc.json'), 'utf-8')
  );
  return {
    lernaJsonPath,
    rootPath: rootMonorepo,
    root: rootMonorepo === process.cwd(),
    packageJsonPath: path.resolve(rootMonorepo, 'package.json'),
    rootYoConfig,
    pobConfig: rootYoConfig && rootYoConfig.pob,
    pobMonorepoConfig:
      rootYoConfig && rootYoConfig.pob && rootYoConfig.pob.monorepo,
  };
};

module.exports = !lernaJsonPath ? false : getInLernaThings();
