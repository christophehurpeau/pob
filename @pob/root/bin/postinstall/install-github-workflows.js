import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertYarnBerry } from "../../lib/assert-yarn-berry.js";
import { getPackageManagerCommands } from "./packageManagerHelpers.js";

// this workflow only exists to commit the build output back to the branch.
const hasBuildOutputInGit = () => {
  try {
    return execFileSync("git", ["ls-files", "--", "*dist/*", "*build/*"], {
      encoding: "utf8",
    })
      .split("\n")
      .some((file) => /(?:^|\/)(?:dist|build)\//.test(file));
  } catch {
    return false;
  }
};

const ensureWorkflowUninstalled = (workflowName) => {
  try {
    fs.unlinkSync(path.resolve(`.github/workflows/${workflowName}.yml`));
  } catch {}
};

const installWorkflow = (
  workflowName,
  { pmRun, pmExec, installOnCICommand, installMutableCommand, ciPreStep },
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
        .replaceAll("$pmRun$", pmRun)
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
    installWorkflow("push-renovate-format", pmCommands);
    ensureWorkflowUninstalled("push-renovate-prettier");
    ensureWorkflowUninstalled("push-renovate-typedoc");
    if (
      pkg.devDependencies &&
      (pkg.devDependencies.rollup ||
        pkg.devDependencies["@pob/rollup-esbuild"] ||
        pkg.devDependencies["@pob/rollup-typescript"]) &&
      pkg.scripts?.build &&
      hasBuildOutputInGit()
    ) {
      installWorkflow("push-renovate-build", pmCommands);
    } else {
      ensureWorkflowUninstalled("push-renovate-build");
    }
  }
}
