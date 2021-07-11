import fs from 'fs';
import path from 'path';
import findup from 'findup-sync';

const lernaJsonPath = findup('lerna.json');
const lintStagedConfigPath = findup('lint-staged.config.js');

const rootMonorepo = lintStagedConfigPath
  ? path.dirname(lintStagedConfigPath)
  : undefined;

const rootMonorepoPkg =
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
    rootMonorepoPkg,
    lernaJsonPath,
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

export default !(rootMonorepoPkg && (rootMonorepoPkg.lerna || !!lernaJsonPath))
  ? false
  : getInLernaThings();
