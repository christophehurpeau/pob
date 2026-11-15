import type { PackageContext } from "../../engine/context.ts";
import type { JsonObject } from "../../engine/model.ts";
import { defineStep } from "../../engine/step.ts";
import { getRollupConfigDependencies } from "../../utils/misc.ts";
import { packageManagerRun } from "../../utils/packageManager.ts";
import {
  workspacesRun,
  workspacesRunExcluding,
  workspacesRunOnly,
  workspacesRunSequential,
  workspacesRunTopological,
} from "../../utils/packageManagerWorkspaces.ts";
import {
  workspaceBuildConfig,
  workspaceFileContent,
  workspacePkg,
} from "./packages.ts";
import {
  hasBundler,
  hasRootBuildDefinitions,
  isAppMonorepo,
  isMonorepoRoot,
} from "./settings.ts";
import { monorepoRollupConfigTemplate } from "./templates.ts";

const rollupConfigFile = "rollup.config.mjs";

/** apps are built by their own build script, in topological order */
const setAppBuildScripts = (ctx: PackageContext): void => {
  const { pkg } = ctx;
  const packageManager = ctx.facts.packageManager;
  const withBundler = ctx.monorepoWorkspaces.some((workspace) =>
    hasBundler(workspaceBuildConfig(workspace)),
  );
  if (withBundler) {
    pkg
      .chain("build")
      .add("workspaces", workspacesRunTopological(packageManager, "build"));
  } else {
    pkg.removeScripts(["build"]);
  }
  // rollup apps have a start script, not a watch one
  pkg.addOrRemoveScripts(
    withBundler &&
      ctx.monorepoWorkspaces.some(
        (workspace) =>
          !!(workspacePkg(workspace).scripts as JsonObject | undefined)?.watch,
      ),
    { watch: workspacesRunExcluding(packageManager, "watch", "*-example") },
  );
};

/** the packages' rollup configs, bundled by a root rollup config */
const setLibBuildScripts = (ctx: PackageContext): void => {
  const { pkg } = ctx;
  const packageManager = ctx.facts.packageManager;
  const rollupConfigs = ctx.monorepoWorkspaces.flatMap((workspace) => {
    const content = workspaceFileContent(workspace, rollupConfigFile);
    return content === undefined
      ? []
      : [{ location: `${workspace.location}/${rollupConfigFile}`, content }];
  });

  // built before the root rollup config loads them, and kept out of
  // clean:build which runs in between
  const rollupConfigDependencies = getRollupConfigDependencies(
    ctx.monorepoWorkspaces.map((workspace) => workspacePkg(workspace)),
    rollupConfigs.map(({ content }) => content),
  );
  const buildRollupConfigDependencies =
    rollupConfigDependencies.length > 0
      ? `${workspacesRunOnly(packageManager, "build", ...rollupConfigDependencies)} && `
      : "";
  const rollupBuild = `${buildRollupConfigDependencies}${packageManagerRun(packageManager, "clean:build")} && rollup --config ${rollupConfigFile}`;

  if (rollupConfigs.length > 0) {
    ctx.output.owned(
      rollupConfigFile,
      monorepoRollupConfigTemplate(
        rollupConfigs.map(({ location }) => location),
      ),
      { format: "oxfmt" },
    );
    pkg.chain("build").add("rollup", rollupBuild);
    pkg.addScripts({
      "clean:build":
        rollupConfigDependencies.length > 0
          ? workspacesRunExcluding(
              packageManager,
              "clean:build",
              ...rollupConfigDependencies,
            )
          : workspacesRun(packageManager, "clean:build"),
      watch: `${rollupBuild} --watch`,
    });
  } else {
    ctx.output.removed(rollupConfigFile);
    pkg.removeScripts([
      "clean:build",
      "watch",
      !hasRootBuildDefinitions(ctx) && "build",
    ]);
  }

  pkg.addOrRemoveScripts(
    ctx.workspacePackages.some(
      (packageContext) => packageContext.config.app?.type === "expo",
    ),
    { "upgrade-expo": workspacesRunSequential(packageManager, "upgrade-expo") },
  );

  const withRollupEsbuild = ctx.monorepoWorkspaces.some(
    (workspace) =>
      workspaceBuildConfig(workspace)?.bundler === "rollup-esbuild",
  );
  pkg.addOrRemoveDevDependencies(withRollupEsbuild, ["@pob/rollup-esbuild"]);
  if (withRollupEsbuild) pkg.removeDevDependencies(["rollup"]);
};

/** root build, watch and rollup config */
export const monorepoBuildStep = defineStep<PackageContext>({
  name: "monorepo-build",
  when: isMonorepoRoot,
  writes: [
    "pkg.scripts.build",
    "pkg.scripts.clean:build",
    "pkg.scripts.watch",
    "pkg.scripts.upgrade-expo",
    "pkg.devDependencies",
    `files:${rollupConfigFile}`,
  ],
  run: (ctx) => {
    if (isAppMonorepo(ctx)) setAppBuildScripts(ctx);
    else setLibBuildScripts(ctx);
  },
});
