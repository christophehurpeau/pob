import type { PackageContext } from "../../engine/context.ts";
import { defineStep } from "../../engine/step.ts";
import { getWorkspaceGlobs } from "../../engine/workspace.ts";
import { isNodeApp, latestLTS } from "../../utils/misc.ts";
import { packageManagerRun } from "../../utils/packageManager.ts";
import { finalFileContent, listRootEntries } from "./packages.ts";
import {
  getMonorepoTypescript,
  hasRootBuildDefinitions,
  isMonorepoRoot,
} from "./settings.ts";
import {
  monorepoTsconfigTemplate,
  monorepoTsconfigToolsTemplate,
} from "./templates.ts";

const rootConfigExtensionsRegex = /\.config\.(?:ts|mts|cts)$/;
// .js scripts count too: tsc then fails on them, which flags their migration
// to typescript
const scriptExtensionsRegex = /\.[cm]?[jt]s$/;

/**
 * Non-published typescript run in place is not part of any package's emitting
 * tsconfig, so it needs a dedicated noEmit project for type-aware linting and
 * tsc -b: root config files (e.g. vitest.config.ts) and a root scripts/ dir.
 * A scripts/ dir with only shell scripts gives tsc no input (TS18003).
 */
const hasTools = (ctx: PackageContext): boolean =>
  listRootEntries(ctx).some((name) => rootConfigExtensionsRegex.test(name)) ||
  ctx.initial
    .listFiles("scripts")
    .some((filePath) => scriptExtensionsRegex.test(filePath));

const getTypescriptPackagePaths = (ctx: PackageContext): string[] => {
  const packagePaths = ctx.workspacePackages
    .filter(
      (packageContext) =>
        finalFileContent(packageContext, "tsconfig.json") !== undefined,
    )
    .map((packageContext) => packageContext.location);
  if (packagePaths.length === 0 && ctx.workspacePackages.length > 0) {
    throw new Error(
      "monorepo.typescript is enabled but no package has a tsconfig.json",
    );
  }
  return packagePaths;
};

/** node apps include their scripts in their own tsconfig.json */
const getPackagePathsWithScriptsIncluded = (
  ctx: PackageContext,
  packagePaths: readonly string[],
): string[] =>
  ctx.workspacePackages
    .filter(
      (packageContext) =>
        ctx.config.monorepo?.typescript !== "check-only" &&
        packageContext.config.build?.typescript !== "check-only" &&
        isNodeApp(packageContext.config) &&
        packagePaths.includes(packageContext.location) &&
        packageContext.initial.exists("scripts"),
    )
    .map((packageContext) => packageContext.location);

const removeTsconfigs = (ctx: PackageContext): void => {
  ctx.output.removed("tsconfig.json");
  ctx.output.removed("tsconfig.tools.json");
};

/** root tsconfig.json references, typescript dependencies and scripts */
export const monorepoTypescriptStep = defineStep<PackageContext>({
  name: "monorepo-typescript",
  when: isMonorepoRoot,
  reads: ["pkg.name", "pkg.workspaces"],
  writes: [
    "pkg.devDependencies",
    "pkg.scripts.tsc",
    "pkg.scripts.tsc:go",
    "pkg.scripts.build:definitions",
    "pkg.scripts.build",
    "files:tsconfig.json",
    "files:tsconfig.tools.json",
  ],
  run: (ctx) => {
    const { pkg } = ctx;
    const { enable } = getMonorepoTypescript(ctx);

    // "typescript" is aliased to the typescript 6 api package, still required
    // by typescript-eslint and typedoc. "@typescript/native" is typescript 7,
    // which provides the "tsc" binary, kept for the "tsc:go" script. "tsrs" is
    // the rust port of typescript 7, used by all the other scripts.
    pkg.addOrRemoveDevDependencies(
      pkg.get<string>("name") === "@pob/eslint-config-monorepo" || enable,
      ["typescript", "@typescript/native", "tsrs"],
    );

    if (!enable) {
      pkg.removeScripts(["tsc", "tsc:go", "build:definitions"]);
      removeTsconfigs(ctx);
      return;
    }

    const packagePaths = getTypescriptPackagePaths(ctx);
    const withTools = hasTools(ctx);
    // tsc fails on a tsconfig.json without files nor references, like the one
    // of a new monorepo without packages
    const hasTypescriptProjects = packagePaths.length > 0 || withTools;
    const withDefinitions = hasRootBuildDefinitions(ctx);

    // tsrs and tsc do not share their .tsbuildinfo: switching between them
    // triggers a full rebuild
    pkg.addOrRemoveScripts(hasTypescriptProjects, {
      tsc: "tsrs -b",
      "tsc:go": "tsc -b",
    });
    pkg.addOrRemoveScripts(withDefinitions, {
      "build:definitions": "tsrs -b",
    });
    if (withDefinitions) {
      pkg
        .chain("build")
        .add(
          "definitions",
          packageManagerRun(ctx.facts.packageManager, "build:definitions"),
          { after: ["rollup"] },
        );
    }

    if (!hasTypescriptProjects) {
      removeTsconfigs(ctx);
      return;
    }

    if (withTools) {
      ctx.output.owned(
        "tsconfig.tools.json",
        monorepoTsconfigToolsTemplate({
          nodeVersion: latestLTS,
          workspaceGlobs: getWorkspaceGlobs({
            workspaces: pkg.get("workspaces"),
          }),
          packagePathsWithScriptsIncluded: getPackagePathsWithScriptsIncluded(
            ctx,
            packagePaths,
          ),
        }),
        { format: "oxfmt" },
      );
    } else {
      ctx.output.removed("tsconfig.tools.json");
    }
    ctx.output.owned(
      "tsconfig.json",
      monorepoTsconfigTemplate({ packagePaths, hasTools: withTools }),
      { format: "oxfmt" },
    );
  },
});
