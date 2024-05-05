import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import semver from "semver";

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
        path.resolve(
          path.dirname(fileURLToPath(import.meta.url)),
          `github-workflows/${workflowName}.yml`
        )
      )
    );
  } else {
    ensureWorkflowUninstalled(workflowName);
  }
};

export default function installGithubWorkflows({ pkg, pm }) {
  const yarnMajorVersion = pm.name === "yarn" && semver.major(pm.version);
  const isYarnBerry = pm.name === "yarn" && yarnMajorVersion >= 2;

  if (!isYarnBerry) return;

  if (fs.existsSync(".github")) {
    installWorkflow("push-renovate-pob_root");
    installWorkflow("push-renovate-prettier");
    ensureWorkflowUninstalled("push-renovate-typedoc");
    if (
      pkg.devDependencies &&
      pkg.devDependencies.rollup &&
      pkg.scripts?.build
    ) {
      installWorkflow("push-renovate-build");
    } else {
      ensureWorkflowUninstalled("push-renovate-build");
    }
  }
}
