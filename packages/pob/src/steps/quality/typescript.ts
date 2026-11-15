import path from "node:path";
import type { PackageContext } from "../../engine/context.ts";
import type { JsonObject } from "../../engine/model.ts";
import { defineStep } from "../../engine/step.ts";
import {
  appsWithBrowser,
  getAppTsconfigTarget,
  latestLTS,
  maintenanceLTS,
} from "../../utils/misc.ts";
import { finalFileContent } from "../monorepo/packages.ts";
import { getPackageEnvs } from "../settings.ts";
import {
  dependsOn,
  findSiblingPackage,
  getDependentConfigs,
  getWorkspacePackageNames,
  readRelativeFiles,
} from "./monorepoPackages.ts";
import type { TypescriptOptions } from "./settings.ts";
import { getTypescriptOptions } from "./settings.ts";
import type { TsconfigTemplateOptions } from "./tsconfigTemplates.ts";
import {
  renderTsconfig,
  renderTsconfigCheckJs,
  renderTsconfigTools,
} from "./tsconfigTemplates.ts";

const expoTarget = "@pob/root/tsconfigs/targets/expo.json";

/**
 * Untranspiled libraries are compiled by the bundler of the apps importing
 * them: expo wins as the widest target, otherwise the apps must agree on one.
 */
const getConsumerAppsTsconfigTarget = (
  ctx: PackageContext,
  packageName: string | undefined,
  withBun: boolean,
): string | undefined => {
  if (packageName === undefined) return undefined;
  const targets = new Set<string>();
  for (const config of getDependentConfigs(ctx, packageName)) {
    if (config.project.type !== "app") continue;
    const appType = config.app?.type;
    const target = getAppTsconfigTarget({
      appType,
      dom: !!appType && appsWithBrowser.includes(appType),
      withBun,
    });
    if (target) targets.add(target);
  }
  if (targets.has(expoTarget)) return expoTarget;
  return targets.size === 1 ? [...targets][0] : undefined;
};

const getPresets = (
  ctx: PackageContext,
  options: TypescriptOptions,
  withBun: boolean,
): string[] => {
  const build = ctx.config.build ?? {};
  const pkg = ctx.initial.readJson<JsonObject>("package.json") ?? {};
  const consumerAppsTarget =
    options.appType === "untranspiled-library" && ctx.facts.inMonorepo
      ? getConsumerAppsTsconfigTarget(
          ctx,
          pkg.name as string | undefined,
          withBun,
        )
      : undefined;
  if (consumerAppsTarget) return [consumerAppsTarget];

  const babelEnvs =
    (build.babelEnvs as unknown[] | undefined) ||
    (build.bundler === "rollup-babel" && build.envs) ||
    [];
  const withBabel = babelEnvs.length > 0;
  const withTypescript =
    withBabel || build.typescript === true || build.bundler === "tsc";
  const jsx = (withBabel || withTypescript) && build.jsx === true;

  if (withBabel) {
    return jsx || options.dom
      ? ["@pob/root/tsconfigs/targets/rollup-babel-with-dom.json"]
      : ["@pob/root/tsconfigs/targets/rollup-babel.json"];
  }
  if (withTypescript) {
    const envs = getPackageEnvs(build) ?? [
      { target: "node", version: maintenanceLTS },
    ];
    const nodeVersion = options.onlyLatestLTS ? latestLTS : maintenanceLTS;
    const bundler = build.bundler as string | false | undefined;
    // oxlint-disable-next-line typescript/no-deprecated -- still read from old configs
    if (build.rollup === false || bundler === false || bundler === "tsc") {
      return withBun
        ? ["@pob/root/tsconfigs/targets/bun.json"]
        : [`@pob/root/tsconfigs/targets/node-${nodeVersion}.json`];
    }
    if (envs.every((env) => env.target === "node")) {
      return [
        `@pob/root/tsconfigs/targets/${
          !bundler || bundler.startsWith("rollup") ? "rollup" : bundler
        }-node-${nodeVersion}.json`,
      ];
    }
    if (envs.some((env) => env.target === "browser")) {
      return ["@pob/root/tsconfigs/targets/rollup-es2015-with-dom.json"];
    }
    return ["@pob/root/tsconfigs/targets/rollup-es2015.json"];
  }

  const target = getAppTsconfigTarget({
    appType: options.isApp
      ? (options.appType as Parameters<
          typeof getAppTsconfigTarget
        >[0]["appType"])
      : undefined,
    dom: options.dom,
    withBun,
  });
  return target ? [target] : [];
};

interface MonorepoReferences {
  composite: unknown;
  srcPaths: [string, string][] | undefined;
  references: string[] | undefined;
  /** another workspace package depends on this one */
  isDependency: boolean;
}

/**
 * Paths and references to the workspace packages this one depends on, located
 * from their names like the yeoman generator did (`../../<scope>/<name>` in a
 * library monorepo, `../../packages/<name>` otherwise), or from their context
 * when the monorepo runs in one process. A dependency is a typescript package
 * when it has a tsconfig.json once its steps ran: in one process, they ran
 * before this package.
 */
const getMonorepoReferences = (
  ctx: PackageContext,
  packageName: string | undefined,
  pkg: JsonObject,
): MonorepoReferences => {
  const inMonorepo = ctx.facts.inMonorepo;
  const composite = inMonorepo?.rootConfig.monorepo?.typescript;
  if (!inMonorepo || !composite) {
    return {
      composite,
      srcPaths: undefined,
      references: undefined,
      isDependency: false,
    };
  }
  const isRootApp = inMonorepo.rootConfig.project.type === "app";
  const packageNames = getWorkspacePackageNames(ctx);
  const toRoot = inMonorepo.relative
    .split("/")
    .filter(Boolean)
    .map(() => "..")
    .join("/");
  const getPackageLocation = (name: string): string => {
    const sibling = findSiblingPackage(ctx, name);
    if (sibling) return path.posix.join(toRoot, sibling.location);
    if (!name.startsWith("@")) return `../../packages/${name}`;
    return isRootApp
      ? `../../packages/${name.slice(name.indexOf("/") + 1)}`
      : `../../${name}`;
  };
  const readPackageJson = (name: string): JsonObject | undefined =>
    findSiblingPackage(ctx, name)?.initial.readJson<JsonObject>(
      "package.json",
    ) ??
    readRelativeFiles(ctx, getPackageLocation(name)).readJson<JsonObject>(
      "package.json",
    );
  const isTypescriptPackage = (name: string): boolean => {
    const sibling = findSiblingPackage(ctx, name);
    if (sibling?.stepsRan) {
      return (
        finalFileContent(sibling, "tsconfig.json") !== undefined &&
        sibling.initial.exists("src")
      );
    }
    const files = readRelativeFiles(ctx, getPackageLocation(name));
    return files.exists("tsconfig.json") && files.exists("src");
  };

  const isDependency = packageNames.some((name) => {
    if (name === packageName) return false;
    const dependentPkg = readPackageJson(name);
    return (
      !!dependentPkg && !!packageName && dependsOn(dependentPkg, packageName)
    );
  });

  const locations = new Map(
    packageNames
      .filter((name) => dependsOn(pkg, name))
      .map((name) => [name, getPackageLocation(name)]),
  );
  const typescriptPackages = new Map(
    [...locations.keys()].map((name) => [name, isTypescriptPackage(name)]),
  );

  return {
    composite,
    isDependency,
    srcPaths: [...locations].map(([name, location]) => [
      name,
      `${location}/${typescriptPackages.get(name) ? "src" : "lib"}`,
    ]),
    references: packageNames
      .filter((name) => typescriptPackages.get(name))
      .map((name) => locations.get(name) ?? ""),
  };
};

const scriptsIncludes = [
  "scripts/**/*.ts",
  "scripts/**/*.mts",
  "scripts/**/*.cts",
];

const tsconfigOptions = (
  ctx: PackageContext,
  options: TypescriptOptions,
  withBun: boolean,
): TsconfigTemplateOptions => {
  const pkg = ctx.initial.readJson<JsonObject>("package.json") ?? {};
  const build = ctx.config.build ?? {};
  const includeScripts = options.includeScripts && !options.onlyCheck;
  const monorepo = getMonorepoReferences(
    ctx,
    pkg.name as string | undefined,
    pkg,
  );
  // composite is meant for packages built and exported before the ones
  // depending on them: libraries, and apps imported by other packages
  const isReferenceable =
    !options.isApp || options.isAppLibrary || monorepo.isDependency;
  const bundler = build.bundler as string | false | undefined;
  return {
    emitDefinitions: options.builddefs,
    // oxlint-disable-next-line typescript/no-deprecated -- still read from old configs
    build: build.rollup === false || bundler === false || bundler === "tsc",
    cacheEnabled: isReferenceable,
    monorepoPackageSrcPaths: monorepo.srcPaths,
    monorepoPackageReferences: monorepo.references,
    // "." also includes root *.ts files, like vitest.config.ts
    rootDir: includeScripts ? "." : options.rootDir,
    srcDirectory: options.srcDirectory || options.rootDir,
    enableHashSlash: options.enableHashSlash,
    jsx: options.jsx,
    jsxPreserve: options.jsxPreserve,
    nextConfig: options.nextConfig,
    composite:
      !!monorepo.composite &&
      monorepo.composite !== "check-only" &&
      isReferenceable,
    incremental: monorepo.composite,
    dom: options.dom,
    resolveJsonModule: options.resolveJsonModule,
    forceExcludeNodeModules: options.forceExcludeNodeModules,
    forceAllowJs: options.forceAllowJs,
    plugins: options.plugins,
    additionalIncludes: [
      ...(includeScripts ? scriptsIncludes : []),
      // the app only imports the generated storybook.requires.ts, which loads
      // ./preview with a require() that typescript does not follow
      ...(options.storybook ? [".storybook/*.ts", ".storybook/*.tsx"] : []),
      // the web storybook rendered by vitest browser tests
      ...(ctx.initial.exists(".storybook-web")
        ? [".storybook-web/*.ts", ".storybook-web/*.tsx"]
        : []),
    ],
    presets: getPresets(ctx, options, withBun),
  };
};

const writeTsconfigs = (
  ctx: PackageContext,
  options: TypescriptOptions,
  withBun: boolean,
): void => {
  const templateOptions = tsconfigOptions(ctx, options, withBun);
  const envs = getPackageEnvs(ctx.config.build) ?? [{ target: "node" }];
  ctx.output.owned(
    "tsconfig.json",
    options.onlyCheck
      ? renderTsconfigCheckJs({
          composite: templateOptions.composite,
          node: envs.some((env) => env.target === "node"),
          srcDirectory: templateOptions.srcDirectory,
        })
      : renderTsconfig(templateOptions),
    { format: "oxfmt" },
  );
  // non-published typescript run in place (scripts/**/*.ts, root *.config.ts)
  // gets a dedicated noEmit project: monorepos handle it at the root, node
  // apps include it in tsconfig.json
  if (ctx.facts.inMonorepo || (options.includeScripts && !options.onlyCheck)) {
    ctx.output.removed("tsconfig.tools.json");
  } else {
    ctx.output.owned("tsconfig.tools.json", renderTsconfigTools(latestLTS), {
      format: "oxfmt",
    });
  }
};

/** tsconfig.json, tsconfig.tools.json, typescript dependencies and scripts */
export const typescriptStep = defineStep<PackageContext>({
  name: "typescript",
  when: (ctx) => !ctx.facts.isMonorepoRoot,
  writes: [
    "pkg.devDependencies",
    "pkg.scripts.tsc",
    "pkg.scripts.tsc:go",
    "files:tsconfig.json",
    "files:tsconfig.tools.json",
  ],
  run: (ctx) => {
    const options = getTypescriptOptions(ctx);
    if (!options) return;
    const { pkg } = ctx;
    const withBun = ctx.facts.packageManager === "bun";

    // "typescript" is aliased to the typescript 6 api package, still required
    // by typescript-eslint and typedoc. "@typescript/native" is typescript 7,
    // which provides the "tsc" binary, kept for the "tsc:go" script. "tsrs" is
    // the rust port of typescript 7, used by all the other scripts.
    pkg.addOrRemoveDevDependencies(
      options.enable || ctx.initial.exists("lib/index.d.ts"),
      ["typescript", "@typescript/native", "tsrs"],
    );

    if (options.enable) {
      writeTsconfigs(ctx, options, withBun);
    } else {
      ctx.output.removed("tsconfig.json");
      ctx.output.removed("tsconfig.tools.json");
    }

    const hasWorkspaces =
      !!ctx.initial.readJson<JsonObject>("package.json")?.workspaces;
    if (hasWorkspaces && options.enable) return;
    const includeScripts = options.includeScripts && !options.onlyCheck;
    // tsrs and tsc do not share their .tsbuildinfo: switching between them
    // triggers a full rebuild
    const tscCommand = (compiler: string): string =>
      ctx.facts.inMonorepo || includeScripts || !options.enable
        ? compiler
        : `${compiler} && ${compiler} -p tsconfig.tools.json`;
    pkg.addOrRemoveScripts(options.enable, {
      tsc: tscCommand("tsrs"),
      "tsc:go": tscCommand("tsc"),
    });
  },
});
