/**
 * package.json entry points (main, types, exports, module, browser) computed
 * by pob:common:transpiler from the build config.
 */
import type { BuildConfig, BuildEnv } from "../../engine/config.ts";
import type { JsonObject } from "../../engine/model.ts";
import { getEntryEnvs } from "../settings.ts";
import { getConfigBundler } from "./settings.ts";

type Entry = string | { name: string; envs?: BuildEnv[] };

interface ExtraEntry {
  name: string;
  types?: string;
}

export interface EntryPoints {
  main?: unknown;
  types?: unknown;
  typings?: unknown;
  exports?: unknown;
  module?: unknown;
  browser?: unknown;
}

export interface EntryPointsOptions {
  build: BuildConfig;
  bundler: string | false | undefined;
  withTypescript: boolean;
  isApp: boolean;
  isAppLibrary: boolean;
  srcDirectory: string;
  buildDirectory: string;
  pkgType: unknown;
  pkgPrivate: unknown;
  /** files of the package before pob runs */
  exists: (filePath: string) => boolean;
  warn: (message: string) => void;
}

const entryName = (entry: Entry): string =>
  typeof entry === "string" ? entry : entry.name;

type ExportTarget = Record<string, string | undefined>;

interface EnvExportOptions {
  env: BuildEnv;
  entryDistName: string;
  bundler: string | false | undefined;
  buildDirectory: string;
  pkgType: unknown;
}

const nodeExportTarget = ({
  env: { target, version, formats, omitVersionInFileName },
  entryDistName,
  bundler,
  buildDirectory,
  pkgType,
}: EnvExportOptions): ExportTarget => {
  const omitTarget = bundler === "esbuild" || bundler === "tsc";
  const omitVersion = omitVersionInFileName ?? bundler === "tsc";
  const cjsExt = pkgType === "module" ? "cjs" : "cjs.js";
  const filenameWithoutExt = `${entryDistName}${
    omitTarget ? "" : `-${target}${omitVersion ? "" : String(version)}`
  }`;
  if (bundler === "tsc") {
    if (formats) throw new Error("tsc does not support formats");
    return { import: `./${buildDirectory}/${filenameWithoutExt}.js` };
  }
  if (!formats || formats.includes("es")) {
    return {
      import: `./${buildDirectory}/${filenameWithoutExt}.mjs`,
      ...(formats?.includes("cjs")
        ? { require: `./${buildDirectory}/${filenameWithoutExt}.${cjsExt}` }
        : {}),
    };
  }
  if (formats.includes("cjs")) {
    return { default: `./${buildDirectory}/${filenameWithoutExt}.${cjsExt}` };
  }
  return {};
};

const envExportTarget = (options: EnvExportOptions): ExportTarget => {
  const { env, entryDistName, buildDirectory } = options;
  const { target, version, formats } = env;
  const fileName = (suffix: string): string =>
    `./${buildDirectory}/${entryDistName}-${suffix}`;
  const esAndCjs = (prefix: string): ExportTarget => ({
    ...(!formats || formats.includes("es")
      ? { import: fileName(`${prefix}.es.js`) }
      : {}),
    ...(formats?.includes("cjs")
      ? { require: fileName(`${prefix}.cjs.js`) }
      : {}),
  });
  switch (target as string) {
    case "node":
      return nodeExportTarget(options);
    case "browser":
      return esAndCjs(`${target}${version || ""}`);
    case "react-native":
      return esAndCjs(target);
    default:
      throw new Error(`Invalid target: ${target}`);
  }
};

const extraEntryExport = (
  extraEntry: ExtraEntry,
  pkgType: unknown,
): unknown => {
  const exportValue = ((): unknown => {
    if (extraEntry.name.endsWith(".css")) {
      return {
        style: `./${extraEntry.name}`,
        import: `./${extraEntry.name}`,
        default: `./${extraEntry.name}`,
      };
    }
    if (pkgType === "module") {
      return extraEntry.name.endsWith(".cjs") ||
        extraEntry.name.endsWith(".d.ts")
        ? `./${extraEntry.name}`
        : `./${extraEntry.name}.js`;
    }
    return {
      import: `./${extraEntry.name}.mjs`,
      require: `./${extraEntry.name}.js`,
    };
  })();
  if (!extraEntry.types) return exportValue;
  return typeof exportValue === "string"
    ? { types: `./${extraEntry.types}`, default: exportValue }
    : { types: `./${extraEntry.types}`, ...(exportValue as JsonObject) };
};

interface BuiltExportsOptions extends EntryPointsOptions {
  entries: Entry[];
  envs: BuildEnv[] | undefined;
  points: EntryPoints;
}

const getEntryEnvsWithDefault = (
  build: BuildConfig,
  entry: Entry,
  envs: BuildEnv[] | undefined,
): BuildEnv[] =>
  getConfigBundler(build) === false ? [] : getEntryEnvs(entry, envs);

/** the exports of a built package: one per entry, then the extra entries */
const builtExports = (options: BuiltExportsOptions): JsonObject => {
  const { build, entries, envs, points, buildDirectory } = options;
  const exports: JsonObject = { "./package.json": "./package.json" };
  for (const entryWithOptionalExt of entries) {
    const entry = entryName(entryWithOptionalExt).replace(/\.[jt]sx?$/, "");
    const exportName = entry === "index" ? "." : `./${entry}`;
    const targets: Record<string, unknown> = {
      types:
        options.pkgPrivate || options.isAppLibrary
          ? `./src/${entry}.ts`
          : `./${buildDirectory}/definitions/${entry}.d.ts`,
    };
    const entryEnvs = getEntryEnvsWithDefault(
      build,
      entryWithOptionalExt,
      envs,
    );
    const defaultNodeEnv =
      options.withTypescript && build.typescript !== "check-only"
        ? entryEnvs.find((env) => env.target === "node")
        : undefined;

    for (const env of entryEnvs) {
      const { target, version } = env;
      if (target === "node" && entry === "browser") continue;
      const exportTarget = envExportTarget({
        env,
        entryDistName: entry,
        bundler: options.bundler,
        buildDirectory,
        pkgType: options.pkgType,
      });
      // eslint: https://github.com/benmosher/eslint-plugin-import/issues/2132
      // jest: https://github.com/facebook/jest/issues/9771
      if (target === "node" && !points.main && exportName === ".") {
        points.main =
          options.pkgType === "module"
            ? exportTarget.import
            : exportTarget.default ||
              exportTarget.require ||
              exportTarget.import;
      }
      const current = targets[target] as JsonObject | undefined;
      targets[target] =
        !version || (target === "node" && version === defaultNodeEnv?.version)
          ? { ...current, ...exportTarget }
          : { [`${target}:${version}`]: exportTarget, ...current };
    }
    exports[exportName] = targets;
  }

  for (const extraEntryConfig of (build.extraEntries ?? []) as (
    | string
    | ExtraEntry
  )[]) {
    const extraEntry =
      typeof extraEntryConfig === "string"
        ? { name: extraEntryConfig }
        : extraEntryConfig;
    const exportPath = extraEntry.name.startsWith(`${options.srcDirectory}/`)
      ? `./${extraEntry.name.slice(options.srcDirectory.length + 1)}`
      : `./${extraEntry.name}`;
    exports[exportPath] = extraEntryExport(extraEntry, options.pkgType);
  }
  return exports;
};

/** the exports written by hand of an unbuilt package, completed */
const completeExports = (exports: unknown, types: unknown): JsonObject => {
  const completed: JsonObject =
    typeof exports === "string"
      ? { ".": exports }
      : { ...(exports as JsonObject) };
  if (!completed["./package.json"]) {
    completed["./package.json"] = "./package.json";
  }
  // throws like the old code when there is no "." export
  if (types && !(completed["."] as JsonObject).types) {
    const dot = completed["."] as JsonObject | string;
    completed["."] = {
      types,
      ...(typeof dot === "string" ? { default: dot } : dot),
    };
  }
  return completed;
};

export const computeEntryPoints = (
  current: EntryPoints,
  options: EntryPointsOptions,
): EntryPoints => {
  const { build, bundler, isApp, isAppLibrary, buildDirectory } = options;
  const points: EntryPoints = { ...current };
  const entries = build.entries as Entry[] | undefined;
  const isBuilt =
    !!bundler || (options.withTypescript && build.typescript !== "check-only");

  if (isApp && !isAppLibrary) {
    delete points.types;
    delete points.typings;
  } else if (points.typings) {
    if (!points.types) points.types = points.typings;
    delete points.typings;
  }

  if (isBuilt) {
    // see exports instead
    delete points.main;
    if (!isApp) {
      points.types = `./${buildDirectory}/definitions/index.d.ts`;
    } else if (isAppLibrary) {
      points.types = `./${options.srcDirectory}/index.ts`;
    }
  } else {
    if (!points.main && !entries) points.exports = "./lib/index.js";
    if (options.pkgType === "module" && options.exists("lib/index.cjs")) {
      points.main = "./lib/index.cjs";
    } else if (!entries || entries.includes("index")) {
      points.main = "./lib/index.js";
    }
    if (!isApp || isAppLibrary) {
      if (options.exists("lib/index.ts")) {
        points.types = "./lib/index.ts";
      } else if (options.exists("lib/index.d.ts") || points.types) {
        points.types = "./lib/index.d.ts";
      }
    }
  }

  const envs = (build.babelEnvs as BuildEnv[] | undefined) || build.envs;
  const indexEntry =
    (entries ?? ["index"]).find((entry) => entryName(entry) === "index") ??
    "index";
  const esAllBrowserEnv = getEntryEnvsWithDefault(build, indexEntry, envs).find(
    (env) =>
      env.target === "browser" &&
      env.version === undefined &&
      (!env.formats || env.formats.includes("es")),
  );
  // webpack 4
  if (esAllBrowserEnv) {
    points.module = `./${buildDirectory}/index-browser.es.js`;
    points.browser = `./${buildDirectory}/index-browser.es.js`;
  } else {
    delete points.module;
    delete points.browser;
  }

  // webpack 5 and node with ESM support
  if (isBuilt) {
    if (!entries) {
      throw new Error("Missing pob config: build.entries");
    }
    points.exports = builtExports({ ...options, entries, envs, points });
  } else if (!points.exports) {
    options.warn("Please setup your package.exports manually.");
  } else {
    points.exports = completeExports(points.exports, points.types);
  }
  return points;
};
