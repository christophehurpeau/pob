/**
 * Values derived from the config and the repository facts, shared by several
 * steps. They replace the options the yeoman orchestrators (pob:lib, pob:app,
 * pob:monorepo) passed to the generators they composed.
 */
import type {
  AppConfig,
  AppType,
  BuildConfig,
  BuildEnv,
  MonorepoConfig,
  PobConfig,
} from "../engine/config.ts";
import type { PackageContext } from "../engine/context.ts";
import type { JsonObject } from "../engine/model.ts";

export type ProjectKind = "lib" | "app" | "monorepo";

export const getProjectKind = (ctx: PackageContext): ProjectKind => {
  if (ctx.facts.isMonorepoRoot) return "monorepo";
  return ctx.config.project.type;
};

export const appsWithTypescript: readonly AppType[] = [
  "alp",
  "next.js",
  "vite",
  "vite-with-server",
  "expo",
  "yarn-plugin",
];

const srcDirectoriesFromAppType: Partial<Record<AppType, string>> = {
  "yarn-plugin": "sources",
};

export const hasReact = (pkg: JsonObject): boolean =>
  !!(
    (pkg.dependencies as JsonObject | undefined)?.react ||
    (pkg.peerDependencies as JsonObject | undefined)?.react
  );

export const hasVitestBrowserPlaywright = (pkg: JsonObject): boolean =>
  [pkg.dependencies, pkg.devDependencies].some(
    (dependencies) =>
      !!(dependencies as JsonObject | undefined)?.[
        "@vitest/browser-playwright"
      ],
  );

const defaultEnvs: BuildEnv[] = [{ target: "node", version: "22" }];

const envKey = (env: BuildEnv): string =>
  JSON.stringify([env.target, env.version ?? null, env.formats ?? null]);

/** Envs a package is built for: see lib/utils/packageEnvs.js */
export const getPackageEnvs = (
  build: BuildConfig | undefined,
): BuildEnv[] | undefined => {
  if (!build) return undefined;
  const envs = (build.babelEnvs as BuildEnv[] | undefined) ?? build.envs;
  if (envs) return envs;
  const entriesEnvs = ((build.entries ?? []) as unknown[]).flatMap((entry) =>
    typeof entry === "object" && entry !== null && "envs" in entry
      ? ((entry as { envs: BuildEnv[] }).envs ?? [])
      : [],
  );
  if (entriesEnvs.length === 0) return undefined;
  return [...new Map(entriesEnvs.map((env) => [envKey(env), env])).values()];
};

export const getEntryEnvs = (
  entry: unknown,
  packageEnvs: BuildEnv[] | undefined,
): BuildEnv[] =>
  (typeof entry === "object" &&
    entry !== null &&
    (entry as { envs?: BuildEnv[] }).envs) ||
  packageEnvs ||
  defaultEnvs;

export interface LibSettings {
  babelEnvs: BuildEnv[];
  withBabel: boolean;
  withTypescript: boolean;
  documentation: boolean;
  testing: boolean;
  codecov: boolean;
  e2e: boolean;
  buildInGit: boolean;
  buildDirectory: string;
  srcDirectory: string;
}

export const getLibSettings = (config: PobConfig): LibSettings => {
  const build = config.build ?? {};
  const lib = config.lib ?? {};
  const babelEnvs =
    (build.babelEnvs as BuildEnv[] | undefined) ||
    (((!build.bundler && build.typescript !== true) ||
      build.bundler === "rollup-babel") &&
      build.envs) ||
    [];
  const withBabel = babelEnvs.length > 0;
  const withTypescript =
    withBabel ||
    build.typescript === true ||
    build.bundler === "tsc" ||
    build.bundler === "rollup-esbuild";
  return {
    babelEnvs,
    withBabel,
    withTypescript,
    documentation: !!lib.documentation,
    testing: !!lib.testing,
    codecov: !!(lib.testing && lib.testing.codecov),
    e2e: !!lib.e2e,
    buildInGit: lib.buildInGit === true,
    buildDirectory: withBabel || withTypescript ? "dist" : "",
    srcDirectory: withBabel || withTypescript ? "src" : "lib",
  };
};

export interface AppSettings {
  app: AppConfig;
  envs: BuildEnv[];
  babel: boolean;
  typescript: boolean;
  srcDirectory: string;
  /** dist when distributed, build otherwise */
  buildDirectory: string;
}

export const getAppSettings = (config: PobConfig): AppSettings => {
  const app = config.app;
  if (!app) throw new Error("Missing app config");
  const envs = getPackageEnvs(config.build) ?? [];
  const babel = envs.length > 0 || appsWithTypescript.includes(app.type);
  return {
    app,
    envs,
    babel,
    typescript: !!(babel || config.build?.typescript),
    srcDirectory: srcDirectoriesFromAppType[app.type] ?? "src",
    buildDirectory: app.distribute ? "dist" : "build",
  };
};

/** Paths ignored by an app type, see lib/generators/app/ignorePaths.js */
export const getAppIgnorePaths = (
  app: Pick<AppConfig, "type" | "distribute" | "buildInGit">,
  pkg: JsonObject | undefined,
): string[] => {
  const dependencies = pkg?.dependencies as JsonObject | undefined;
  switch (app.type) {
    case "alp":
      return ["# alp paths", "/build", "/public", "/data"];
    case "next.js":
      return [
        "# next.js paths",
        "/.next",
        "/out",
        "/build",
        "/.env.local",
        ...(dependencies?.tamagui ? ["# tamagui", "/.tamagui"] : []),
      ];
    case "vite":
    case "vite-with-server":
      return ["/dist"];
    case "node":
      if (!app.distribute) return ["/build"];
      return app.buildInGit ? [] : ["/dist"];
    case "node-library":
    case "alp-node":
      return ["/build"];
    case "storybook":
      return ["/.storybook/storybook.requires.ts"];
    case "expo":
      return [
        "/.expo/",
        "/android/",
        "/ios/",
        "/dist/",
        "/dist-native/",
        "/web-build/",
        "/.expo-shared/",
        "*.jks",
        "*.p8",
        "*.p12",
        "*.key",
        "*.mobileprovision",
        "*.orig.*",
        "*.icon/",
      ];
    case "untranspiled-library":
    case "other":
    case "yarn-plugin":
      return [];
    default:
      throw new Error(`Unknown app type: ${app.type as string}`);
  }
};

interface WorkspacePackageInfo {
  location: string;
  pkg: JsonObject;
  /** undefined for a workspace without a pob config */
  config: PobConfig | undefined;
}

const someDependency = (
  pkgs: JsonObject[],
  test: (name: string) => boolean,
): boolean =>
  pkgs.some((pkg) =>
    [pkg.dependencies, pkg.devDependencies].some(
      (dependencies) =>
        !!dependencies && Object.keys(dependencies).some((name) => test(name)),
    ),
  );

const webStorybookFrameworkRegExp =
  /^@storybook\/(?:.+-(?:vite|webpack5)|nextjs|angular|ember|sveltekit)$/;

export const detectStorybook = (pkgs: JsonObject[]): boolean =>
  someDependency(pkgs, (name) => webStorybookFrameworkRegExp.test(name));

export const detectStorybookReactNative = (pkgs: JsonObject[]): boolean =>
  someDependency(pkgs, (name) => name === "@storybook/react-native");

export interface MonorepoSettings {
  monorepo: MonorepoConfig;
  packages: WorkspacePackageInfo[];
  isAppProject: boolean;
  /** path of the package running e2e tests, "." for the root, "" for none */
  e2eTesting: string;
  rootIgnorePaths: string[];
  hasRootBuild: boolean;
  appTypes: AppType[];
}

/**
 * Every workspace, with or without a pob config, and the initial content of
 * their package.json: the yeoman monorepo generator read them before the
 * packages were updated.
 */
export const getMonorepoSettings = (ctx: PackageContext): MonorepoSettings => {
  const packages: WorkspacePackageInfo[] = ctx.monorepoWorkspaces.map(
    ({ location, pkg, context }) => ({
      location,
      pkg,
      config: context?.config,
    }),
  );
  const allPkgs = [
    ctx.initial.readJson<JsonObject>("package.json") ?? {},
    ...packages.map(({ pkg }) => pkg),
  ];
  const stored = ctx.config.monorepo ?? {};
  const monorepo: MonorepoConfig = {
    storybook: detectStorybook(allPkgs),
    storybookReactNative: detectStorybookReactNative(allPkgs),
    ...stored,
  };
  const isAppProject = ctx.config.project.type === "app";

  const e2eTesting = (() => {
    const value = monorepo.e2eTesting as unknown;
    if (!value || value === "false") return "";
    if (value !== true && value !== "true") return value as string;
    const e2eLocations = packages
      .filter(({ config }) => config?.app?.e2e || config?.lib?.e2e)
      .map(({ location }) => location);
    if (e2eLocations.length > 1) {
      ctx.warn(
        `monorepo.e2eTesting: several packages have e2e tests (${e2eLocations.join(", ")}), set the path of the one to run in ci in the pob config`,
      );
    }
    return e2eLocations.length === 1 ? (e2eLocations[0] ?? ".") : ".";
  })();
  const e2eTestingPath = e2eTesting === "." ? "" : `/${e2eTesting}`;

  const appTypes = [
    ...new Set(
      packages
        .map(({ config }) =>
          config?.project.type === "app" ? config.app?.type : undefined,
        )
        .filter((type): type is AppType => type !== undefined),
    ),
  ];

  return {
    monorepo,
    packages,
    isAppProject,
    e2eTesting,
    rootIgnorePaths: e2eTesting
      ? [
          `${e2eTestingPath}/playwright-report/`,
          `${e2eTestingPath}/test-results/`,
        ]
      : [],
    hasRootBuild:
      monorepo.typescript === true ||
      (!isAppProject &&
        packages.some(
          ({ config, pkg }) =>
            !!(config
              ? config.build?.bundler
              : (pkg.pob as JsonObject | undefined)?.bundler),
        )),
    appTypes,
  };
};

/** The root package manager command used in scripts. */
export const getPackageManager = (ctx: PackageContext): string =>
  ctx.facts.packageManager;
