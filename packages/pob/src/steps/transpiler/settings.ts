/**
 * Options the orchestrators gave to pob:common:babel and
 * pob:common:transpiler, and the build config these generators normalized in
 * package.json#pob before using it.
 */
import type { AppType, BuildConfig, BuildEnv } from "../../engine/config.ts";
import type { PackageContext } from "../../engine/context.ts";
import { latestLTS, maintenanceLTS } from "../../utils/misc.ts";
import { getProjectKind } from "../settings.ts";

/** app types composing pob:common:babel and pob:common:transpiler */
const transpiledAppTypes: readonly AppType[] = [
  "node",
  "node-library",
  "alp-node",
];

export const usesTranspiler = (ctx: PackageContext): boolean => {
  const kind = getProjectKind(ctx);
  if (kind === "lib") return true;
  const type = ctx.config.app?.type;
  return (
    kind === "app" && type !== undefined && transpiledAppTypes.includes(type)
  );
};

export interface TranspilerOptions {
  isApp: boolean;
  isAppLibrary: boolean;
  /** alp-node: alp-rollup-plugin-config */
  useAppConfig: boolean;
  srcDirectory: string;
  buildDirectory: string;
  onlyLatestLTS: boolean;
}

/** PobLibGenerator.initializing: every node env targets the latest LTS */
const getLibOnlyLatestLTS = (build: BuildConfig | undefined): boolean =>
  build?.envs
    ? build.envs
        .filter((env) => env.target === "node")
        .every((env) => env.version === latestLTS)
    : false;

export const getTranspilerOptions = (
  ctx: PackageContext,
): TranspilerOptions => {
  if (getProjectKind(ctx) === "lib") {
    return {
      isApp: false,
      isAppLibrary: false,
      useAppConfig: false,
      srcDirectory: "src",
      buildDirectory: "dist",
      onlyLatestLTS: getLibOnlyLatestLTS(ctx.config.build),
    };
  }
  const app = ctx.config.app;
  if (!app) throw new Error("Missing app config");
  return {
    isApp: true,
    isAppLibrary: app.type === "node-library",
    useAppConfig: app.type === "alp-node",
    srcDirectory: "src",
    buildDirectory: app.distribute ? "dist" : "build",
    onlyLatestLTS: true,
  };
};

type Bundler = BuildConfig["bundler"] | false;

/** `bundler: false` is not in the schema but old configs and the code know it */
export const getConfigBundler = (build: BuildConfig): Bundler => build.bundler;

/** `rollup: false` of old configs: build with tsc */
export const isRollupDisabled = (build: BuildConfig): boolean =>
  (build as Record<string, unknown>).rollup === false;

const usesBabelEnvs = (build: BuildConfig): boolean => {
  const bundler = getConfigBundler(build);
  return (!bundler && build.typescript !== true) || bundler === "rollup-babel";
};

/** `>=` of the old code, between a version as written and an LTS string */
const versionAtLeast = (version: unknown, lts: string): boolean =>
  typeof version === "string" ? version >= lts : Number(version) >= Number(lts);

/**
 * pob:common:transpiler (default): adds an env for the supported LTS when the
 * node envs are older, then drops the node envs older than it.
 */
const updateNodeEnvs = (
  envs: BuildEnv[],
  onlyLatestLTS: boolean,
): BuildEnv[] => {
  const lts = onlyLatestLTS ? latestLTS : maintenanceLTS;
  const updated = [...envs];
  if (
    !envs.some((env) => env.target === "node" && String(env.version) === lts) &&
    envs.some(
      (env) =>
        env.target === "node" &&
        (["4", "6", "8", "10", "12", "14", "16", "18", "20"].includes(
          String(env.version),
        ) ||
          (onlyLatestLTS && String(env.version) === maintenanceLTS)),
    )
  ) {
    updated.unshift({
      target: "node",
      version: lts,
      ...(onlyLatestLTS || envs.length === 1
        ? { omitVersionInFileName: true }
        : {}),
    });
  }
  return updated.filter(
    (env) => env.target !== "node" || versionAtLeast(env.version, lts),
  );
};

export interface TranspilerBuild {
  /** package.json#pob as the transpiler leaves it */
  build: BuildConfig;
  /** babel envs remain: pob-babel is no longer supported */
  useBabel: boolean;
}

/**
 * The build config after the changes pob:common:babel (prompting) and
 * pob:common:transpiler (default) made to package.json#pob. The second run of
 * the old engine used these values: the converged output depends on them.
 */
export const resolveTranspilerBuild = (
  ctx: PackageContext,
  options: TranspilerOptions,
): TranspilerBuild => {
  const initialBuild = ctx.config.build;
  if (!initialBuild && options.isApp) {
    // pob:common:babel prompted for the babel targets
    throw new Error(
      "Missing pob config: build (package.json#pob), with at least the bundler",
    );
  }
  let build: BuildConfig = { ...initialBuild };

  // pob:common:babel (prompting): the babel envs prompted again
  const promptedBabelEnvs =
    (build.babelEnvs as BuildEnv[] | undefined) ||
    (usesBabelEnvs(build) ? build.envs : []) ||
    [];
  const hasNewBabelEnvs = promptedBabelEnvs.some(
    (env) => env.target === "node" || env.target === "browser",
  );
  if (!hasNewBabelEnvs && usesBabelEnvs(build)) {
    const { babelEnvs: _, ...rest } = build;
    build = rest;
    if (!build.typescript) {
      const {
        envs: _envs,
        entries: _entries,
        jsx: _jsx,
        ...withoutEnvs
      } = build;
      build = withoutEnvs;
    }
  }
  const babelEnvs =
    (build.babelEnvs as BuildEnv[] | undefined) ||
    (usesBabelEnvs(build) && build.envs) ||
    [];
  const useBabel = hasNewBabelEnvs || babelEnvs.length > 0;

  // pob:common:transpiler (default)
  const bundler = getConfigBundler(build);
  if (
    !build.typescript &&
    bundler !== false &&
    bundler?.startsWith("rollup-") &&
    bundler !== "rollup-babel"
  ) {
    build = { ...build, typescript: true };
  }
  const { withReact: _, ...withoutReact } = build;
  build = withoutReact;
  const envs = (build.babelEnvs as BuildEnv[] | undefined) || build.envs;
  if (envs && bundler !== false) {
    const updatedEnvs = updateNodeEnvs(envs, options.onlyLatestLTS);
    build = build.babelEnvs
      ? { ...build, babelEnvs: updatedEnvs }
      : { ...build, envs: updatedEnvs };
  }
  return { build, useBabel };
};
