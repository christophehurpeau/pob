import type { PackageContext } from "../../engine/context.ts";
import { defineStep } from "../../engine/step.ts";
import { packageManagerRun } from "../../utils/packageManager.ts";
import { getInitialPackageName, getReleaseOptions } from "./settings.ts";
import { releaseWorkflowTemplate } from "./templates.ts";

const releaseWorkflowPath = ".github/workflows/release.yml";

/** port of pob:common:release: release workflow, or preversion without ci */
export const releaseStep = defineStep<PackageContext>({
  name: "release",
  reads: ["pkg.version"],
  writes: ["pkg.scripts.preversion", `files:${releaseWorkflowPath}`],
  run: (ctx) => {
    const { pkg, output } = ctx;
    const options = getReleaseOptions(ctx);
    const packageManager = ctx.facts.packageManager;

    if (options.enable && options.ci) {
      const version = pkg.get<string | undefined>("version");
      output.owned(
        releaseWorkflowPath,
        releaseWorkflowTemplate({
          packageManager,
          enablePublish: options.enablePublish,
          build: options.build,
          disableYarnGitCache: options.disableYarnGitCache,
          isMonorepo: options.isMonorepo,
          isMonorepoIndependent:
            options.isMonorepo && (!version || version === "0.0.0"),
        }),
      );
    } else {
      output.removed(releaseWorkflowPath);
    }

    if (options.enable && !options.ci) {
      pkg.addScripts({
        preversion: [
          packageManagerRun(packageManager, "lint"),
          options.build && packageManagerRun(packageManager, "build"),
          "repository-check-dirty",
        ]
          .filter(Boolean)
          .join(" && "),
      });
    } else if (getInitialPackageName(ctx) !== "pob-dependencies") {
      pkg.removeScripts(["preversion"]);
    }
  },
});
