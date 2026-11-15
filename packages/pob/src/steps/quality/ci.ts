import type { PackageContext } from "../../engine/context.ts";
import { defineStep } from "../../engine/step.ts";
import { latestLTS } from "../../utils/misc.ts";
import {
  packageManagerExec,
  packageManagerExecWithCwd,
  packageManagerRun,
} from "../../utils/packageManager.ts";
import {
  renderDocumentationWorkflow,
  renderPushWorkflow,
  renderPushWorkflowSplit,
} from "./ciTemplates.ts";
import {
  getCiNodeMajorVersions,
  getPushWorkflowRequiredChecks,
} from "./requiredChecks.ts";
import type { CiOptions } from "./settings.ts";
import { getCiOptions } from "./settings.ts";

const pushWorkflowPath = ".github/workflows/push.yml";
const documentationWorkflowPath = ".github/workflows/gh-pages.yml";

const writePushWorkflow = (
  ctx: PackageContext,
  options: CiOptions,
  checks: boolean,
): string[] => {
  const { packageManager } = options;
  const nodeMajorVersions = getCiNodeMajorVersions(options.onlyLatestLTS);
  const templateOptions = {
    packageManager,
    disableYarnGitCache: options.disableYarnGitCache,
    testing: options.testing,
    testRunner: options.testRunner,
    e2eTesting: options.e2eTesting,
    checks,
    build: options.build,
    typescript: options.typescript,
    codecov: options.codecov,
    nodeMajorVersions,
    nodeLatestMajorVersion: latestLTS,
    installPlaywrightBrowserCommand: options.playwrightBrowserTestingPath
      ? packageManagerExecWithCwd(
          packageManager,
          options.playwrightBrowserTestingPath,
          "playwright install --with-deps chromium",
        )
      : "",
    mongodbBinaryCacheKeyFile: options.mongodbBinaryCacheKeyFile,
    packageManagerRun: (script: string, packagePath?: string) =>
      packageManagerRun(packageManager, script, packagePath),
    packageManagerExec: (command: string) =>
      packageManagerExec(packageManager, command),
  };
  ctx.output.owned(
    pushWorkflowPath,
    options.splitJobs
      ? renderPushWorkflowSplit(templateOptions)
      : renderPushWorkflow(templateOptions),
    { format: "oxfmt" },
  );
  return getPushWorkflowRequiredChecks({
    splitJobs: options.splitJobs,
    checks,
    build: options.build,
    testing: options.testing,
    nodeMajorVersions,
  });
};

/**
 * Github actions workflows of a root. Publishes the status checks the push
 * workflow reports in `ci.contexts`, required by the branch protection.
 */
export const ciStep = defineStep<PackageContext>({
  name: "ci",
  reads: ["pkg.scripts.checks"],
  writes: [
    "ci.contexts",
    `files:${pushWorkflowPath}`,
    `files:${documentationWorkflowPath}`,
  ],
  run: (ctx) => {
    const options = getCiOptions(ctx);
    const contexts =
      options.enable && !options.disablePushWorkflow
        ? writePushWorkflow(ctx, options, !!ctx.pkg.get("scripts.checks"))
        : [];
    if (contexts.length === 0) ctx.output.removed(pushWorkflowPath);
    ctx.model("ci").set("contexts", contexts);

    if (options.enable && !options.isApp && options.documentation) {
      ctx.output.owned(
        documentationWorkflowPath,
        renderDocumentationWorkflow({
          packageManager: options.packageManager,
          disableYarnGitCache: options.disableYarnGitCache,
          build: options.build,
          typedoc: options.typescript,
          nodeLatestMajorVersion: latestLTS,
        }),
        { format: "oxfmt" },
      );
    } else {
      ctx.output.removed(documentationWorkflowPath);
    }
  },
});
