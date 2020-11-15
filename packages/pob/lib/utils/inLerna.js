'use strict';

const fs = require('fs');
const path = require('path');
const findup = require('findup-sync');

const legacyLernaJsonPath = findup('lerna.json');
const huskyConfigPath = findup('husky.config.js');

const rootMonorepo = huskyConfigPath
  ? path.dirname(huskyConfigPath)
  : undefined;

const rootPkg =
  rootMonorepo &&
  JSON.parse(
    fs.readFileSync(path.resolve(rootMonorepo, 'package.json'), 'utf-8'),
  );

const getInLernaThings = () => {
  const rootYoConfig = JSON.parse(
    fs.readFileSync(path.resolve(rootMonorepo, '.yo-rc.json'), 'utf-8'),
  );
  const cwd = process.cwd();

  return {
    rootPkg,
    rootPath: rootMonorepo,
    root: rootMonorepo === cwd,
    isRootYarn2:
      rootYoConfig &&
      rootYoConfig.pob &&
      rootYoConfig.pob.project &&
      rootYoConfig.pob.project.yarn2,
    relative: path.relative(rootMonorepo, cwd),
    rootYoConfig,
    pobConfig: rootYoConfig && rootYoConfig.pob,
    pobMonorepoConfig:
      rootYoConfig && rootYoConfig.pob && rootYoConfig.pob.monorepo,
  };
};

module.exports = !(rootPkg && (rootPkg.lerna || !!legacyLernaJsonPath))
  ? false
  : getInLernaThings();
