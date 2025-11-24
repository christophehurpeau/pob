import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertYarnBerry } from "../../lib/assert-yarn-berry.js";
import { getPackageManagerCommands } from "./packageManagerHelpers.js";

const ensureWorkflowUninstalled = (workflowName) => {
  try {
    fs.unlinkSync(path.resolve(`.github/workflows/${workflowName}.yml`));
  } catch {}
};

const installWorkflow = (
  workflowName,
  { pmExec, installOnCICommand, installMutableCommand, ciPreStep },
  condition = true,
) => {
  if (condition) {
    fs.writeFileSync(
      path.resolve(`.github/workflows/${workflowName}.yml`),
      fs
        .readFileSync(
          path.resolve(
            path.dirname(fileURLToPath(import.meta.url)),
            `github-workflows/${workflowName}.yml`,
          ),
          { encoding: "utf8" },
        )
        .replaceAll("$pmExec$", pmExec)
        .replaceAll("$ciPreStep$", ciPreStep)
        .replaceAll("$installOnCICommand$", installOnCICommand)
        .replaceAll("$installMutableCommand$", installMutableCommand),
    );
  } else {
    ensureWorkflowUninstalled(workflowName);
  }
};

export default function installGithubWorkflows({ pkg, pm }) {
  assertYarnBerry(pm);

  const pmCommands = getPackageManagerCommands(pm, true);

  if (fs.existsSync(".github")) {
    installWorkflow("push-renovate-pob_root", pmCommands);
    installWorkflow("push-renovate-prettier", pmCommands);
    ensureWorkflowUninstalled("push-renovate-typedoc");
    if (
      pkg.devDependencies &&
      (pkg.devDependencies.rollup ||
        pkg.devDependencies["@pob/rollup-esbuild"] ||
        pkg.devDependencies["@pob/rollup-typescript"]) &&
      pkg.scripts?.build
    ) {
      installWorkflow("push-renovate-build", pmCommands);
    } else {
      ensureWorkflowUninstalled("push-renovate-build");
    }
  }
}
