/**
 * The pob config of a package: the content of `pob.json`. Older projects store
 * it in `.yo-rc.json` (`pob` key), `.pob.json` and `package.json#pob`: they are
 * read and migrated on every run by {@link resolveConfig}.
 */

import { isDeepStrictEqual } from "node:util";

export type PackageManager = "yarn" | "npm" | "pnpm" | "bun";
export type YarnNodeLinker = "node-modules" | "pnp" | "pnpm";
export type TestRunner = "vitest" | "node";

export type AppType =
  | "alp"
  | "vite"
  | "vite-with-server"
  | "next.js"
  | "node"
  | "node-library"
  | "untranspiled-library"
  | "alp-node"
  | "expo"
  | "yarn-plugin"
  | "storybook"
  | "other";

export interface ProjectConfig {
  /** kind of project */
  type: "lib" | "app";
  /** package manager of the repository, only at the root */
  packageManager?: PackageManager;
  /** yarn only */
  yarnNodeLinker?: YarnNodeLinker;
  /** continuous integration with github actions, only at the root */
  ci?: boolean;
  /** see https://yarnpkg.com/features/caching#offline-mirror, default true */
  disableYarnGitCache?: boolean;
  /** only support the latest LTS of node in a monorepo */
  onlyLatestLTS?: boolean;
  /** @deprecated replaced by onlyLatestLTS */
  supportsNode14?: boolean;
}

export interface LibTestingConfig {
  runner?: TestRunner;
  codecov?: boolean;
}

export interface LibConfig {
  /** generated documentation */
  documentation?: boolean;
  testing?: false | LibTestingConfig;
  /** playwright e2e tests */
  e2e?: boolean;
  /** commit the build output in git */
  buildInGit?: boolean;
}

export interface AppConfig {
  type: AppType;
  testing?: boolean;
  testRunner?: TestRunner;
  codecov?: boolean;
  e2e?: boolean;
  /** build to dist and publish, instead of building to build */
  distribute?: boolean;
  buildInGit?: boolean;
  /** expo: on-device react-native storybook */
  storybook?: boolean;
  /** expo: alouette (tailwind with nativewind) */
  alouette?: boolean;
  /** next.js: next export */
  export?: boolean;
}

export interface MonorepoConfig {
  ci?: boolean;
  disablePushWorkflow?: boolean;
  testing?: boolean;
  testRunner?: TestRunner;
  /** path of the package running the e2e tests, or true to detect it */
  e2eTesting?: boolean | string;
  codecov?: boolean;
  documentation?: boolean;
  typescript?: boolean | "check-only";
  eslint?: boolean;
  storybook?: boolean;
  storybookReactNative?: boolean;
  /** file whose hash is the cache key of the mongodb binaries in ci */
  mongodbBinaryCacheKeyFile?: string;
}

export interface BuildEnv {
  target: "node" | "browser";
  version?: string | number;
  formats?: ("es" | "cjs")[];
  omitVersionInFileName?: boolean;
  executable?: boolean;
}

/** How the sources are built and type-checked: package.json#pob before. */
export interface BuildConfig {
  bundler?:
    | "rollup-esbuild"
    | "rollup-typescript"
    | "rollup-babel"
    | "tsc"
    | "esbuild";
  typescript?: boolean | "check-only";
  envs?: BuildEnv[];
  entries?: string[];
  extraEntries?: unknown[];
  jsx?: boolean;
  /** @deprecated */
  rollup?: boolean;
  [key: string]: unknown;
}

export interface PobConfig {
  $schema?: string;
  project: ProjectConfig;
  lib?: LibConfig;
  app?: AppConfig;
  monorepo?: MonorepoConfig;
  renovate?: { enable: boolean };
  build?: BuildConfig;
}

/** Config as found on disk, before migrations. */
export interface RawConfigSources {
  /** pob.json */
  pobJson?: Record<string, unknown>;
  /** the pob key of .yo-rc.json */
  yoRc?: Record<string, unknown>;
  /** .pob.json of old versions */
  legacyPobJson?: Record<string, unknown>;
  /** package.json#pob */
  pkgPob?: Record<string, unknown>;
}

type RawConfig = Record<string, unknown> & {
  build?: Record<string, unknown>;
};

export type Migration = (config: RawConfig) => RawConfig;

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/** `pob.type` of very old versions held the project config. */
const migrateProjectStorage: Migration = (config) => {
  if (isObject(config.project) || !isObject(config.type)) return config;
  const { type, ...rest } = config;
  return { ...rest, project: type };
};

const migrateYarn2: Migration = (config) => {
  if (!isObject(config.project) || !("yarn2" in config.project)) return config;
  const { yarn2, ...project } = config.project;
  if (yarn2) project.yarnNodeLinker = "node-modules";
  return { ...config, project };
};

const migrateProjectPackageManagerOptions: Migration = (config) => {
  if (!isObject(config.project)) return config;
  if (config.project.packageManager === "yarn") return config;
  if (!("yarnNodeLinker" in config.project)) return config;
  const { yarnNodeLinker: _, ...project } = config.project;
  return { ...config, project };
};

const legacyLibKeys = ["pob", "pob-config", "pob-lib-config"] as const;

/** lib config of old versions: `pob`, `pob-config`, `pob-lib-config` keys */
const migrateLibStorage: Migration = (config) => {
  const { libtest: _, ...withoutLibtest } = config;
  let lib = withoutLibtest.lib;
  for (const key of legacyLibKeys) {
    if (lib === undefined) lib = withoutLibtest[key];
  }
  const rest = Object.fromEntries(
    Object.entries(withoutLibtest).filter(
      ([key]) => !(legacyLibKeys as readonly string[]).includes(key),
    ),
  );
  return lib === undefined ? rest : { ...rest, lib };
};

const babelEnvFromString = (env: string): Record<string, unknown> => {
  switch (env) {
    case "node6":
    case "node7":
    case "node8":
    case "node10":
      return { target: "node", version: 14, formats: ["cjs"] };
    case "webpack-node7":
    case "module-node7":
    case "module-node8":
      return { target: "node", version: 14, formats: ["es"] };
    case "module":
    case "webpack":
      return { target: "browser", formats: ["es"] };
    case "module-modern-browsers":
    case "webpack-modern-browsers":
      return { target: "browser", version: "modern", formats: ["es"] };
    case "browsers":
      return { target: "browser", formats: ["cjs"] };
    default:
      throw new Error(`Unsupported env ${env}`);
  }
};

/**
 * The lib config held envs, entries and withReact before they moved to
 * package.json#pob, as babel envs.
 */
const migrateLibBuildKeys: Migration = (config) => {
  if (!isObject(config.lib)) return config;
  const removedLibKeys = new Set([
    "doclets",
    "flow",
    "react",
    "entries",
    "envs",
    "withReact",
  ]);
  const lib = Object.fromEntries(
    Object.entries(config.lib).filter(([key]) => !removedLibKeys.has(key)),
  );
  const libEnvs = config.lib.envs;
  const libEntries = config.lib.entries;
  const libWithReact = config.lib.withReact;
  const build = { ...config.build };
  let babelEnvs =
    libEnvs ??
    build.babelEnvs ??
    (build.bundler === "rollup-babel" && build.envs);
  const entries = libEntries ?? build.entries;
  const jsx = libWithReact ?? build.withReact ?? build.jsx;
  if (Array.isArray(babelEnvs) && typeof babelEnvs[0] === "string") {
    babelEnvs = (babelEnvs as string[]).map(babelEnvFromString);
  }
  if (config.lib.babelEnvs) {
    // the old lib generator started over from prompts
    return { ...config, lib: {} };
  }
  delete build.withReact;
  if (Array.isArray(babelEnvs) && babelEnvs.length > 0) {
    delete build.babelEnvs;
    build.bundler = "rollup-babel";
    build.envs = babelEnvs;
    build.entries = entries;
    build.jsx = jsx;
  }
  return { ...config, lib, build };
};

const migrateLibTesting: Migration = (config) => {
  if (!isObject(config.lib)) return config;
  const lib = { ...config.lib };
  if (lib.testing === true) {
    lib.testing = { codecov: true };
  } else if (isObject(lib.testing)) {
    const { travisci: _t, circleci: _c, ci: _ci, ...testing } = lib.testing;
    lib.testing = testing;
  }
  if (isObject(lib.documentation)) lib.documentation = true;
  return { ...config, lib };
};

/** babel envs: the babel generator moves pob.babelEnvs to pob.envs */
const migrateBabelEnvs: Migration = (config) => {
  const build = config.build;
  if (!build) return config;
  if (
    build.babelEnvs ||
    (build.envs &&
      ((!build.bundler && build.typescript !== true) ||
        build.bundler === "rollup-babel"))
  ) {
    const { babelEnvs, ...rest } = build;
    return {
      ...config,
      build: {
        ...rest,
        bundler: "rollup-babel",
        envs: babelEnvs ?? build.envs,
      },
    };
  }
  return config;
};

const migrateAppStorage: Migration = (config) => {
  const { "pob-app-config": legacyApp, ...rest } = config;
  const app = rest.app ?? legacyApp;
  if (!isObject(app)) return rest;
  const { ci: _, ...appWithoutCi } = app;
  return { ...rest, app: appWithoutCi };
};

const migrateMonorepoDerivedKeys: Migration = (config) => {
  if (!isObject(config.monorepo)) return config;
  const { packageNames: _, ...monorepo } = config.monorepo;
  return { ...config, monorepo };
};

/** answers yeoman stored for the prompts: not config */
const dropPromptValues: Migration = (config) => {
  const { promptValues: _, ...rest } = config;
  return rest;
};

/** Applied in this order on every run: never removed, never reordered. */
export const legacyMigrations: readonly Migration[] = [
  migrateProjectStorage,
  migrateYarn2,
  migrateProjectPackageManagerOptions,
  migrateLibStorage,
  migrateLibBuildKeys,
  migrateLibTesting,
  migrateBabelEnvs,
  migrateAppStorage,
  migrateMonorepoDerivedKeys,
  dropPromptValues,
];

export interface ResolvedConfig {
  config: PobConfig;
  /** where the config came from */
  source: "pob.json" | "legacy";
  /** keys that must be set (by a prompt or by hand) before running */
  missing: string[];
}

const migrate = (config: RawConfig): RawConfig => {
  let migrated = structuredClone(config);
  for (const migration of legacyMigrations) migrated = migration(migrated);
  return migrated;
};

/** dotted paths of the values of a config: arrays are values */
const leafPaths = (value: unknown, prefix: string[] = []): string[][] => {
  if (!isObject(value)) return prefix.length > 0 ? [prefix] : [];
  return Object.entries(value).flatMap(([key, child]) =>
    leafPaths(child, [...prefix, key]),
  );
};

const getAt = (value: unknown, segments: readonly string[]): unknown => {
  let current = value;
  for (const segment of segments) {
    current = isObject(current) ? current[segment] : undefined;
  }
  return current;
};

const legacySources = [
  {
    name: ".yo-rc.json (pob key)",
    toConfig: (sources: RawConfigSources) => sources.yoRc,
  },
  {
    name: "package.json#pob",
    toConfig: (sources: RawConfigSources) =>
      sources.pkgPob && { build: sources.pkgPob },
  },
  {
    name: ".pob.json",
    toConfig: (sources: RawConfigSources) =>
      sources.legacyPobJson && { lib: sources.legacyPobJson },
  },
] as const;

export class LegacyConfigConflictError extends Error {
  constructor(conflicts: readonly string[]) {
    super(
      `pob.json and legacy config files disagree, nothing was changed. Move the values to keep into pob.json, then remove them from the legacy file:\n${conflicts.join("\n")}`,
    );
    this.name = "LegacyConfigConflictError";
  }
}

/**
 * The legacy sources are removed once pob.json exists: they must not hold a
 * value pob.json does not have, or it would be lost.
 */
const assertLegacySourcesMatch = (
  sources: RawConfigSources,
  pobJsonConfig: RawConfig,
): void => {
  const conflicts = legacySources.flatMap(({ name, toConfig }) => {
    const legacyConfig = toConfig(sources);
    if (!legacyConfig) return [];
    const migrated = migrate(legacyConfig);
    const differing = leafPaths(migrated).filter(
      (segments) =>
        !isDeepStrictEqual(
          getAt(migrated, segments),
          getAt(pobJsonConfig, segments),
        ),
    );
    if (differing.length === 0) return [];
    return [
      `  - ${name}: ${differing.map((segments) => segments.join(".")).join(", ")}`,
    ];
  });
  if (conflicts.length > 0) throw new LegacyConfigConflictError(conflicts);
};

/**
 * Merges the config sources and applies the legacy migrations. Pure: the
 * sources are read by the caller. Throws a {@link LegacyConfigConflictError}
 * when pob.json exists and a legacy source holds a different value.
 */
export const resolveConfig = (
  sources: RawConfigSources,
  { isRoot }: { isRoot: boolean },
): ResolvedConfig => {
  const source = sources.pobJson ? "pob.json" : "legacy";
  let raw: RawConfig = sources.pobJson
    ? structuredClone(sources.pobJson)
    : {
        ...structuredClone(sources.yoRc ?? {}),
        ...(sources.pkgPob ? { build: structuredClone(sources.pkgPob) } : {}),
      };
  if (
    !sources.pobJson &&
    sources.legacyPobJson &&
    raw.lib === undefined &&
    legacyLibKeys.every((key) => raw[key] === undefined)
  ) {
    raw.lib = structuredClone(sources.legacyPobJson);
  }
  raw = migrate(raw);
  if (sources.pobJson) assertLegacySourcesMatch(sources, raw);

  const missing: string[] = [];
  const project = (
    isObject(raw.project) ? raw.project : {}
  ) as Partial<ProjectConfig>;
  if (!project.type) missing.push("project.type");
  if (isRoot && !project.packageManager) missing.push("project.packageManager");
  if (isRoot && project.ci === undefined) missing.push("project.ci");

  return {
    config: raw as unknown as PobConfig,
    source,
    missing,
  };
};
