import fs from "node:fs";
import path from "node:path";
import findup from "findup-sync";

const lintStagedConfigPath = findup("lint-staged.config.js");
const lintStagedConfigCjsPath = findup("lint-staged.config.cjs");

const rootMonorepo =
  lintStagedConfigPath || lintStagedConfigCjsPath
    ? path.dirname(lintStagedConfigPath || lintStagedConfigCjsPath)
    : undefined;

const rootMonorepoPkg =
  rootMonorepo &&
  JSON.parse(fs.readFileSync(path.resolve(rootMonorepo, "package.json")));

const getInMonorepoThings = () => {
  const rootYoConfig = JSON.parse(
    fs.readFileSync(path.resolve(rootMonorepo, ".yo-rc.json"))
  );
  const cwd = process.cwd();

  return {
    rootMonorepoPkg,
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
    relative: path
      .relative(rootMonorepo, cwd)
      // transform windows to linux-like paths
      .replace(/\\+/g, "/"),
    rootYoConfig,
    pobConfig: rootYoConfig && rootYoConfig.pob,
    pobMonorepoConfig:
      rootYoConfig && rootYoConfig.pob && rootYoConfig.pob.monorepo,
  };
};

export default !(
  rootMonorepoPkg &&
  (rootMonorepoPkg.workspaces || rootMonorepoPkg.lerna)
)
  ? false
  : getInMonorepoThings();
