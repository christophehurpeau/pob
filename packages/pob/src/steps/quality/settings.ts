/**
 * The options the yeoman orchestrators (pob:lib, pob:app, pob:monorepo) gave
 * to pob:common:typescript, pob:common:testing, pob:common:e2e and, through
 * pob:common:testing, to pob:core:ci. Booleans are normalized like yeoman did
 * (`Boolean(value)`, an explicit `undefined` becomes `false`).
 */
import type {
  BuildConfig,
  MonorepoConfig,
  PackageManager,
} from "../../engine/config.ts";
import type { PackageContext } from "../../engine/context.ts";
import type { JsonObject } from "../../engine/model.ts";
import { appsWithBrowser, latestLTS, nodeAppTypes } from "../../utils/misc.ts";
import {
  getAppSettings,
  getLibSettings,
  getMonorepoSettings,
  getProjectKind,
  hasReact,
  hasVitestBrowserPlaywright,
} from "../settings.ts";

/** monorepo config of the root, from a package or from the root itself */
export const getRootMonorepoConfig = (
  ctx: PackageContext,
): MonorepoConfig | undefined =>
  ctx.facts.isMonorepoRoot
    ? ctx.config.monorepo
    : ctx.facts.inMonorepo?.rootConfig.monorepo;

const initialPkg = (ctx: PackageContext): JsonObject =>
  ctx.initial.readJson<JsonObject>("package.json") ?? {};

/** pob:lib computed it from the node envs of the package */
export const getLibOnlyLatestLTS = (build: BuildConfig | undefined): boolean =>
  build?.envs
    ? build.envs
        .filter((env) => env.target === "node")
        .every((env) => env.version === latestLTS)
    : false;

export interface TypescriptOptions {
  enable: boolean;
  isApp: boolean;
  isAppLibrary: boolean;
  appType: string;
  rootDir: string;
  srcDirectory: string;
  includeScripts: boolean;
  jsx: boolean;
  jsxPreserve: boolean;
  forceExcludeNodeModules: boolean;
  forceAllowJs: boolean;
  dom: boolean;
  resolveJsonModule: boolean;
  builddefs: boolean;
  plugins: string[];
  nextConfig: boolean;
  onlyLatestLTS: boolean;
  onlyCheck: boolean;
  enableHashSlash: boolean;
  storybook: boolean;
}

const hashSlashAppTypes = new Set([
  "alp",
  "vite",
  "vite-with-server",
  "alp-node",
  "next.js",
  "expo",
]);

/** pob:common:typescript is composed by pob:lib and pob:app only */
export const getTypescriptOptions = (
  ctx: PackageContext,
): TypescriptOptions | undefined => {
  const build = ctx.config.build ?? {};
  const rootCheckOnly =
    !!ctx.facts.inMonorepo &&
    ctx.facts.inMonorepo.rootConfig.monorepo?.typescript === "check-only";
  const onlyCheck = build.typescript === "check-only" || rootCheckOnly;
  const defaults = {
    isAppLibrary: false,
    appType: "",
    includeScripts: false,
    jsxPreserve: false,
    forceExcludeNodeModules: false,
    forceAllowJs: false,
    resolveJsonModule: false,
    plugins: [],
    nextConfig: false,
    enableHashSlash: false,
    storybook: false,
    onlyCheck,
  };
  switch (getProjectKind(ctx)) {
    case "lib": {
      const settings = getLibSettings(ctx.config);
      return {
        ...defaults,
        enable: settings.withTypescript || onlyCheck,
        isApp: false,
        dom: !!build.envs?.some((env) => env.target === "browser"),
        jsx:
          (settings.withBabel || settings.withTypescript) && build.jsx === true,
        builddefs: true,
        onlyLatestLTS: getLibOnlyLatestLTS(ctx.config.build),
        rootDir: "src",
        srcDirectory: settings.withTypescript ? "src" : "lib",
      };
    }
    case "app": {
      const settings = getAppSettings(ctx.config);
      const type = settings.app.type;
      const pkg = initialPkg(ctx);
      return {
        ...defaults,
        enable: settings.typescript || onlyCheck,
        isApp: true,
        isAppLibrary:
          type === "node-library" || type === "untranspiled-library",
        appType: type,
        nextConfig: type === "next.js",
        rootDir: type === "expo" ? "." : settings.srcDirectory,
        srcDirectory: settings.srcDirectory,
        includeScripts: nodeAppTypes.includes(type),
        builddefs: false,
        dom:
          appsWithBrowser.includes(type) ||
          (settings.babel &&
            settings.envs.some((env) => env.target === "browser")),
        jsx:
          settings.envs.length > 0 && build.jsx !== undefined
            ? build.jsx
            : hasReact(pkg),
        jsxPreserve: type === "next.js",
        forceExcludeNodeModules: type === "next.js",
        forceAllowJs: type === "next.js",
        resolveJsonModule: true,
        onlyLatestLTS: true,
        enableHashSlash: hashSlashAppTypes.has(type),
        storybook: !!settings.app.storybook,
        plugins: type === "next.js" ? ["next"] : [],
      };
    }
    case "monorepo":
      return undefined;
    default:
      throw new Error("Unknown project kind");
  }
};

export interface TestingOptions {
  /** the monorepo root */
  monorepo: boolean;
  enable: boolean;
  /** "" or undefined when the config has none, like the old generator */
  runner: string | undefined;
  ci: boolean;
  disablePushWorkflow: boolean;
  typescript: boolean;
  build: boolean;
  codecov: boolean;
  documentation: boolean;
  packageManager: PackageManager;
  isApp: boolean;
  /** path of the package running e2e tests, "" for none */
  e2eTesting: string;
  splitCIJobs: boolean;
  onlyLatestLTS: boolean;
  srcDirectory: string;
  disableYarnGitCache: boolean;
  playwrightBrowserTestingPath: string;
  mongodbBinaryCacheKeyFile: string;
}

const getPackageRunner = (
  ctx: PackageContext,
  testing: unknown,
  ownRunner: string | undefined,
): string | undefined => {
  if (!testing) return undefined;
  const runner = ctx.facts.inMonorepo
    ? ctx.facts.inMonorepo.rootConfig.monorepo?.testRunner
    : ownRunner;
  return runner || "";
};

export const getTestingOptions = (ctx: PackageContext): TestingOptions => {
  const project = ctx.config.project;
  const defaults = {
    monorepo: false,
    packageManager: ctx.facts.packageManager,
    disableYarnGitCache: project.disableYarnGitCache !== false,
    ci: !!project.ci,
    disablePushWorkflow: false,
    splitCIJobs: false,
    playwrightBrowserTestingPath: "",
    mongodbBinaryCacheKeyFile: "",
  };
  switch (getProjectKind(ctx)) {
    case "lib": {
      const settings = getLibSettings(ctx.config);
      const testing = ctx.config.lib?.testing;
      const build = settings.withBabel || settings.withTypescript;
      return {
        ...defaults,
        enable: !!testing,
        runner: getPackageRunner(
          ctx,
          testing,
          testing ? testing.runner : undefined,
        ),
        e2eTesting: settings.e2e ? "." : "",
        build,
        typescript: settings.withTypescript,
        documentation: settings.documentation,
        codecov: settings.codecov,
        isApp: false,
        srcDirectory: build ? "src" : "lib",
        onlyLatestLTS: getLibOnlyLatestLTS(ctx.config.build),
      };
    }
    case "app": {
      const settings = getAppSettings(ctx.config);
      const { app } = settings;
      return {
        ...defaults,
        enable: !!app.testing,
        runner: getPackageRunner(ctx, app.testing, app.testRunner),
        e2eTesting: app.e2e ? "." : "",
        typescript: settings.typescript,
        build:
          (settings.babel || ctx.config.build?.typescript === true) &&
          app.type !== "expo",
        documentation: false,
        codecov: !!app.codecov,
        isApp: true,
        onlyLatestLTS: true,
        srcDirectory: settings.srcDirectory,
      };
    }
    case "monorepo": {
      const settings = getMonorepoSettings(ctx);
      const monorepo = ctx.config.monorepo ?? {};
      return {
        ...defaults,
        monorepo: true,
        enable: !!monorepo.testing,
        runner: monorepo.testRunner,
        e2eTesting: settings.e2eTesting,
        build: settings.hasRootBuild,
        typescript: !!monorepo.typescript,
        documentation: !!monorepo.documentation,
        codecov: !!(monorepo.testing && monorepo.codecov),
        ci: !!monorepo.ci,
        disablePushWorkflow: !!monorepo.disablePushWorkflow,
        isApp: settings.isAppProject,
        onlyLatestLTS:
          project.type === "app" ||
          // oxlint-disable-next-line typescript/no-deprecated -- still read from old configs
          project.supportsNode14 === false ||
          project.onlyLatestLTS === true,
        splitCIJobs: settings.packages.length > 8,
        srcDirectory: "src",
        playwrightBrowserTestingPath:
          settings.packages.find(({ pkg }) => hasVitestBrowserPlaywright(pkg))
            ?.location ?? "",
        mongodbBinaryCacheKeyFile: monorepo.mongodbBinaryCacheKeyFile ?? "",
      };
    }
    default:
      throw new Error("Unknown project kind");
  }
};

export interface CiOptions {
  enable: boolean;
  disablePushWorkflow: boolean;
  build: boolean;
  typescript: boolean;
  testing: boolean;
  testRunner: string | undefined;
  e2eTesting: string;
  codecov: boolean;
  documentation: boolean;
  isApp: boolean;
  onlyLatestLTS: boolean;
  splitJobs: boolean;
  packageManager: PackageManager;
  disableYarnGitCache: boolean;
  playwrightBrowserTestingPath: string;
  mongodbBinaryCacheKeyFile: string;
}

/**
 * pob:common:testing composed pob:core:ci with its own options at a root, and
 * with `enable: false` in a monorepo package.
 */
export const getCiOptions = (ctx: PackageContext): CiOptions => {
  const testing = getTestingOptions(ctx);
  return {
    enable: ctx.facts.isRoot && testing.ci,
    disablePushWorkflow: testing.disablePushWorkflow,
    build: testing.build,
    typescript: testing.typescript,
    testing: testing.enable,
    testRunner: testing.runner,
    e2eTesting: testing.e2eTesting,
    codecov: testing.codecov,
    documentation: testing.documentation,
    isApp: testing.isApp,
    onlyLatestLTS: testing.onlyLatestLTS,
    splitJobs: testing.splitCIJobs,
    packageManager: testing.packageManager,
    disableYarnGitCache: testing.disableYarnGitCache,
    playwrightBrowserTestingPath: testing.playwrightBrowserTestingPath,
    mongodbBinaryCacheKeyFile: testing.mongodbBinaryCacheKeyFile,
  };
};

/** pob:common:e2e is composed by pob:lib and pob:app only */
export const getE2eEnabled = (ctx: PackageContext): boolean | undefined => {
  switch (getProjectKind(ctx)) {
    case "lib":
      return !!ctx.config.lib?.e2e;
    case "app":
      return !!getAppSettings(ctx.config).app.e2e;
    case "monorepo":
      return undefined;
    default:
      throw new Error("Unknown project kind");
  }
};
