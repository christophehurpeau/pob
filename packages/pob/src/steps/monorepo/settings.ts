import type { BuildConfig } from "../../engine/config.ts";
import type { PackageContext } from "../../engine/context.ts";

export const isMonorepoRoot = (ctx: PackageContext): boolean =>
  ctx.facts.isMonorepoRoot;

export const isAppMonorepo = (ctx: PackageContext): boolean =>
  ctx.config.project.type === "app";

/** `monorepo.typescript` of the root config: true or "check-only" */
export const getMonorepoTypescript = (
  ctx: PackageContext,
): { enable: boolean; checkOnly: boolean } => {
  const typescript = ctx.config.monorepo?.typescript;
  return { enable: !!typescript, checkOnly: typescript === "check-only" };
};

/**
 * The root build ends with the build of the typescript definitions: a chain
 * contribution of the monorepo-typescript step.
 */
export const hasRootBuildDefinitions = (ctx: PackageContext): boolean => {
  const { enable, checkOnly } = getMonorepoTypescript(ctx);
  return enable && !isAppMonorepo(ctx) && !checkOnly;
};

/** a package built with a bundler, see MonorepoWorkspacesGenerator */
export const hasBundler = (build: BuildConfig | undefined): boolean =>
  (build?.envs?.length ?? 0) > 0 ||
  ((build?.babelEnvs as unknown[] | undefined)?.length ?? 0) > 0 ||
  build?.bundler === "rollup-babel";
