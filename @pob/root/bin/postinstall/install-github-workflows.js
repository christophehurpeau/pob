'use strict';

const fs = require('fs');
const path = require('path');
const semver = require('semver');

const ensureWorkflowUninstalled = (workflowName) => {
  try {
    fs.unlinkSync(path.resolve(`.github/workflows/${workflowName}.yml`));
  } catch {}
};

const installWorkflow = (workflowName, condition = true) => {
  if (condition) {
    fs.writeFileSync(
      path.resolve(`.github/workflows/${workflowName}.yml`),
      fs.readFileSync(
        path.resolve(__dirname, `../../github-workflows/${workflowName}.yml`),
      ),
    );
  } else {
    ensureWorkflowUninstalled(workflowName);
  }
};

module.exports = function installGithubWorkflows({ pkg, pm }) {
  const yarnMajorVersion = pm.name === 'yarn' && semver.major(pm.version);
  const isYarnBerry = pm.name === 'yarn' && yarnMajorVersion >= 2;

  if (!isYarnBerry) return;

  installWorkflow('push-renovate-pob_root');
  installWorkflow('push-renovate-prettier');

  installWorkflow(
    'push-renovate-typedoc',
    !!(pkg.devDependencies && pkg.devDependencies.typedoc),
  );
};
