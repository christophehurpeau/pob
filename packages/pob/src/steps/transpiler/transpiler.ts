/**
 * Port of lib/generators/common/transpiler/CommonTranspilerGenerator.js:
 * build scripts and dependencies, package.json entry points, rollup config,
 * browserslist and the build of a standalone package.
 */
import type { BuildConfig } from "../../engine/config.ts";
import type { PackageContext } from "../../engine/context.ts";
import type { JsonObject } from "../../engine/model.ts";
import { defineStep } from "../../engine/step.ts";
import { packageManagerRun } from "../../utils/packageManager.ts";
import { getPackageEnvs } from "../settings.ts";
import type { EntryPoints } from "./exports.ts";
import { computeEntryPoints } from "./exports.ts";
import type { TranspilerOptions } from "./settings.ts";
import {
  getConfigBundler,
  getTranspilerOptions,
  isRollupDisabled,
  resolveTranspilerBuild,
  usesTranspiler,
} from "./settings.ts";
import { appRollupConfig, libRollupConfig } from "./templates.ts";

/** ids of the commands of the `build` script chain */
export const buildChainIds = {
  /** rollup, tsc or esbuild */
  bundle: "bundle",
  /** run build:definitions */
  definitions: "definitions",
} as const;

const getBundler = (
  build: BuildConfig,
  withTypescript: boolean,
): string | false => {
  if (!withTypescript || build.typescript === "check-only") return false;
  const configBundler = getConfigBundler(build);
  if (
    isRollupDisabled(build) ||
    configBundler === "tsc" ||
    (!configBundler && !build.typescript)
  ) {
    return "tsc";
  }
  return (
    configBundler ??
    (build.typescript === true ? "rollup-typescript" : "rollup-babel")
  );
};

const getCleanCommand = (bundler: string | false): string | undefined => {
  if (!bundler) return undefined;
  if (bundler === "rollup-typescript") return "pob-typescript-clean-out";
  if (bundler === "rollup-esbuild" || bundler === "esbuild") {
    return "pob-esbuild-clean-out";
  }
  if (bundler === "tsc") return "rm -Rf";
  throw new Error(`Invalid bundler: ${bundler}`);
};

const getBundleCommand = (
  bundler: string | false,
  run: (script: string) => string,
  watch: boolean,
): string | undefined => {
  if (!bundler) return undefined;
  if (bundler.startsWith("rollup")) {
    return `${run("clean:build")} && rollup --config rollup.config.mjs${watch ? " --watch" : ""}`;
  }
  if (bundler === "tsc") return watch ? "tsrs --watch" : "tsrs";
  if (bundler === "esbuild") {
    return watch ? "pob-esbuild-watch" : "pob-esbuild-build";
  }
  return undefined;
};

/** a package without build: checks the hand-written definitions */
const getDefinitionsCheck = (ctx: PackageContext): string | undefined => {
  if (ctx.initial.exists("lib/index.ts")) {
    return "tsrs --lib esnext --noEmit --skipLibCheck ./lib/index.ts";
  }
  if (ctx.initial.exists("lib/index.d.ts")) {
    return "tsrs --lib esnext --noEmit --skipLibCheck ./lib/index.d.ts";
  }
  return undefined;
};

interface ScriptsOptions {
  options: TranspilerOptions;
  bundler: string | false;
  withTypescript: boolean;
}

const writeScripts = (
  ctx: PackageContext,
  { options, bundler, withTypescript }: ScriptsOptions,
): void => {
  const { pkg } = ctx;
  const run = (script: string): string =>
    packageManagerRun(ctx.facts.packageManager, script);
  const hasCleanBuild = !!bundler && bundler !== "tsc";
  const cleanBuild = `${getCleanCommand(bundler) ?? ""} ${options.buildDirectory}`;

  if (options.isApp) {
    pkg.removeScripts(["watch"]);
    pkg.addOrRemoveScripts(hasCleanBuild, {
      "clean:build": cleanBuild,
      clean: run("clean:build"),
    });
    pkg.addOrRemoveScripts(bundler, {
      start: getBundleCommand(bundler, run, true),
    });
  } else {
    pkg.removeScripts(["start"]);
    pkg.addOrRemoveScripts(hasCleanBuild, { "clean:build": cleanBuild });
  }

  const shouldBuildDefinitions =
    !options.isApp && withTypescript && bundler !== "tsc";
  const buildDefinitions = ((): string | undefined => {
    if (shouldBuildDefinitions) return "tsrs -p tsconfig.json";
    if (!options.isApp && !bundler && !withTypescript) {
      return getDefinitionsCheck(ctx);
    }
    return undefined;
  })();
  pkg.addOrRemoveScripts(buildDefinitions, {
    "build:definitions": buildDefinitions,
  });

  const bundleCommand = getBundleCommand(bundler, run, false);
  if (!bundleCommand && !buildDefinitions) {
    pkg.removeScripts(["build"]);
    return;
  }
  const build = pkg.chain("build");
  if (bundleCommand) build.add(buildChainIds.bundle, bundleCommand);
  if (buildDefinitions) {
    build.add(buildChainIds.definitions, run("build:definitions"), {
      after: [buildChainIds.bundle],
    });
  }
};

interface DependenciesOptions {
  options: TranspilerOptions;
  bundler: string | false;
  compiles: boolean;
}

const writeDependencies = (
  ctx: PackageContext,
  { options, bundler, compiles }: DependenciesOptions,
): void => {
  const { pkg } = ctx;
  pkg.addOrRemoveDevDependencies(bundler === "rollup-typescript", [
    "@pob/rollup-typescript",
  ]);
  pkg.addOrRemoveDevDependencies(bundler === "esbuild" && compiles, [
    "@pob/esbuild",
  ]);
  pkg.addOrRemoveDevDependencies(bundler === "rollup-esbuild" && compiles, [
    "@pob/rollup-esbuild",
  ]);
  pkg.addOrRemoveDependencies(
    (bundler === "tsc" || bundler === "rollup-typescript") && compiles,
    ["tslib"],
    "^",
  );
  pkg.addOrRemoveDevDependencies(
    typeof bundler === "string" &&
      bundler.startsWith("rollup") &&
      options.isApp &&
      !options.isAppLibrary &&
      options.useAppConfig,
    ["alp-rollup-plugin-config"],
  );
};

/** the lib step forces false when present: it overrides this step */
const writeSideEffects = (
  ctx: PackageContext,
  options: TranspilerOptions,
): void => {
  const { pkg } = ctx;
  if (options.isApp && !options.isAppLibrary) {
    pkg.delete("sideEffects");
  } else if (!pkg.has("sideEffects")) {
    pkg.set("sideEffects", true);
    if (options.isApp) {
      ctx.warn("Setting pkg.sideEffects to true, as it was not defined");
    }
  } else if (options.isApp && pkg.get("sideEffects")) {
    ctx.warn(
      "pkg.sideEffects is true, are you sure you can't set it to false ?",
    );
  }
};

const entryPointKeys = [
  "main",
  "types",
  "typings",
  "exports",
  "module",
  "browser",
] as const;

const writeOrDelete = (
  ctx: PackageContext,
  key: string,
  value: unknown,
): void => {
  if (value === undefined) ctx.pkg.delete(key);
  else ctx.pkg.set(key, value);
};

const browserslistProduction = [
  "defaults",
  "> 0.2%",
  "not ie < 12",
  "not safari < 10",
  "not ios_saf < 10",
];

const getBrowserslist = (
  current: unknown,
  hasTargetBrowser: boolean,
  options: TranspilerOptions,
): unknown => {
  if (hasTargetBrowser) {
    const { modern: _, ...userQueries } =
      Array.isArray(current) || !current ? {} : (current as JsonObject);
    return { ...userQueries, production: browserslistProduction };
  }
  if (options.isApp && !options.isAppLibrary && current) {
    return { ...(current as JsonObject), production: browserslistProduction };
  }
  return undefined;
};

interface RollupConfigOptions {
  build: BuildConfig;
  options: TranspilerOptions;
  bundler: string | false;
  hasEnvs: boolean;
}

const writeRollupConfig = (
  ctx: PackageContext,
  { build, options, bundler, hasEnvs }: RollupConfigOptions,
): void => {
  const configBundler = getConfigBundler(build);
  if (
    build.typescript === true &&
    !isRollupDisabled(build) &&
    typeof configBundler === "string" &&
    configBundler.startsWith("rollup") &&
    typeof bundler === "string"
  ) {
    const entries = (build.entries ?? ["index"]) as unknown[];
    ctx.output.owned(
      "rollup.config.mjs",
      options.isApp
        ? appRollupConfig({
            rollupConfigLib: bundler,
            config: options.useAppConfig,
            outDirectory: options.buildDirectory,
            enableRun: !options.isAppLibrary && entries.includes("index"),
          })
        : libRollupConfig({
            rollupConfigLib: bundler,
            outDirectory: options.buildDirectory,
          }),
      { format: "oxfmt" },
    );
  } else if (
    // pob:common:babel deleted it too, without rollup
    (build.typescript !== true && !isRollupDisabled(build)) ||
    !hasEnvs ||
    configBundler === "esbuild" ||
    configBundler === "tsc"
  ) {
    ctx.output.removed("rollup.config.mjs");
  }
};

export const transpilerStep = defineStep<PackageContext>({
  name: "transpiler",
  when: usesTranspiler,
  after: ["babel"],
  reads: ["pkg.type", "pkg.private"],
  writes: [
    "pkg.scripts.build",
    "pkg.scripts.build:definitions",
    "pkg.scripts.clean",
    "pkg.scripts.clean:build",
    "pkg.scripts.start",
    "pkg.scripts.watch",
    "pkg.dependencies",
    "pkg.devDependencies",
    "pkg.sideEffects",
    ...entryPointKeys.map((key) => `pkg.${key}`),
    "pkg.browserslist",
    "files:rollup.config.mjs",
  ],
  run: (ctx) => {
    const { pkg } = ctx;
    const options = getTranspilerOptions(ctx);
    const { build } = resolveTranspilerBuild(ctx, options);
    const withTypescript = !!build.typescript || !!build.bundler;
    const bundler = getBundler(build, withTypescript);
    const compiles = withTypescript && build.typescript !== "check-only";

    writeScripts(ctx, { options, bundler, withTypescript });
    writeDependencies(ctx, { options, bundler, compiles });
    writeSideEffects(ctx, options);

    const current = Object.fromEntries(
      entryPointKeys.map((key) => [key, pkg.get(key)]),
    ) as EntryPoints;
    const points = computeEntryPoints(current, {
      build,
      bundler,
      withTypescript,
      isApp: options.isApp,
      isAppLibrary: options.isAppLibrary,
      srcDirectory: options.srcDirectory,
      buildDirectory: options.buildDirectory,
      pkgType: pkg.get("type"),
      pkgPrivate: pkg.get("private"),
      exists: ctx.initial.exists,
      warn: ctx.warn,
    });
    for (const key of entryPointKeys) writeOrDelete(ctx, key, points[key]);

    const packageEnvs = getPackageEnvs(build);
    writeOrDelete(
      ctx,
      "browserslist",
      getBrowserslist(
        pkg.get("browserslist"),
        !!packageEnvs?.some((env) => env.target === "browser"),
        options,
      ),
    );
    writeRollupConfig(ctx, {
      build,
      options,
      bundler,
      hasEnvs: !!packageEnvs && packageEnvs.length > 0,
    });
  },
});
