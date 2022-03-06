import fs from 'fs';
import path from 'path';
import findup from 'findup-sync';

const lernaJsonPath = findup('lerna.json');
const lintStagedConfigPath = findup('lint-staged.config.js');
const lintStagedConfigCjsPath = findup('lint-staged.config.cjs');

const rootMonorepo =
  lintStagedConfigPath || lintStagedConfigCjsPath
    ? path.dirname(lintStagedConfigPath || lintStagedConfigCjsPath)
    : undefined;

const rootMonorepoPkg =
  rootMonorepo &&
  JSON.parse(fs.readFileSync(path.resolve(rootMonorepo, 'package.json')));

const getInLernaThings = () => {
  const rootYoConfig = JSON.parse(
    fs.readFileSync(path.resolve(rootMonorepo, '.yo-rc.json')),
  );
  const cwd = process.cwd();

  return {
    rootMonorepoPkg,
    lernaJsonPath: lernaJsonPath || path.resolve('lerna.json'),
    rootPath: rootMonorepo,
    root: rootMonorepo === cwd,
    rootPackageManager:
      rootYoConfig &&
      rootYoConfig.pob &&
      rootYoConfig.pob.project &&
      rootYoConfig.pob.project.packageManager,
    rootYarnNodeLinker:
      rootYoConfig &&
      rootYoConfig.pob &&
      rootYoConfig.pob.project &&
      rootYoConfig.pob.project.yarnNodeLinker,
    relative: path.relative(rootMonorepo, cwd),
    rootYoConfig,
    pobConfig: rootYoConfig && rootYoConfig.pob,
    pobMonorepoConfig:
      rootYoConfig && rootYoConfig.pob && rootYoConfig.pob.monorepo,
  };
};

export default !(
  rootMonorepoPkg &&
  (rootMonorepoPkg.workspaces || rootMonorepoPkg.lerna || !!lernaJsonPath)
)
  ? false
  : getInLernaThings();
