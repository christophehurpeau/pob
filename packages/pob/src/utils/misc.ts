/**
 * Small helpers shared by several step groups, ported from lib/utils.
 */
import type { AppType, PobConfig } from "../engine/config.ts";
import type { JsonObject } from "../engine/model.ts";

export const latestLTS = "24";
export const maintenanceLTS = "22";

/**
 * Packages exempt from the minimum release age, so a repository can use a
 * release of pob or of its own dependencies right away. Lockstep releases are
 * listed together: nightingale-logger pins nightingale-levels and
 * nightingale-types to the version published with it.
 */
const otherReleaseAgePackages = [
  "pob",
  "pob-dependencies",
  "check-package-dependencies",
  "alouette",
  "alouette-icons",
  "nightingale",
  "nightingale-logger",
  "nightingale-levels",
  "nightingale-types",
];

// bun matches exact names only (no glob): every published @pob package,
// including @pob/eslint-config-typescript, no longer in this repository.
const pobScopePackages = [
  "@pob/codemods",
  "@pob/commitlint-config",
  "@pob/esbuild",
  "@pob/eslint-config",
  "@pob/eslint-config-typescript",
  "@pob/eslint-config-typescript-react",
  "@pob/eslint-plugin",
  "@pob/pretty-pkg",
  "@pob/rollup",
  "@pob/rollup-esbuild",
  "@pob/rollup-typescript",
  "@pob/root",
  "@pob/sort-object",
  "@pob/sort-pkg",
  "@pob/version",
];

/** pnpm `minimumReleaseAgeExclude`, yarn `npmPreapprovedPackages` (globs) */
export const minimumReleaseAgeExcludePatterns = [
  "@pob/*",
  ...otherReleaseAgePackages,
];

/** bun `minimumReleaseAgeExcludes` (exact names) */
export const minimumReleaseAgeExcludeNames = [
  ...pobScopePackages,
  ...otherReleaseAgePackages,
];

/**
 * Repository name for a package name: without its scope, nor the "-monorepo"
 * suffix of monorepo roots.
 */
export const getRepoName = (pkgName: string): string =>
  pkgName.replace(/^@[^/]+\//, "").replace(/-monorepo$/, "");

// characters allowed by GitHub in account and repository names
const validGitNameRegex = /^[\w.-]+$/;

export interface ParsedRepositoryUrl {
  gitHost: string;
  gitAccount: string;
  repoName: string;
}

/**
 * Parses a git remote url, or the "repository" field of a package.json.
 * Returns undefined when the url cannot come from a real remote.
 */
export const parseRepositoryUrl = (
  repository: unknown,
): ParsedRepositoryUrl | undefined => {
  const url =
    typeof repository === "string"
      ? repository
      : (repository as { url?: unknown } | undefined)?.url;
  if (!url || typeof url !== "string") return undefined;

  const match =
    /^(?:git\+)?(?:git@|ssh:\/\/git@|https?:\/\/)([^./:]+)(?:\.[a-z]+)?[/:]([^/]+)\/([^/]+?)(?:\.git)?\/?$/.exec(
      url,
    );
  if (!match) return undefined;

  const [, gitHost = "", gitAccount = "", repoName = ""] = match;
  if (
    !validGitNameRegex.test(gitAccount) ||
    !validGitNameRegex.test(repoName)
  ) {
    return undefined;
  }
  return { gitHost, gitAccount, repoName };
};

/* oxlint-disable regexp/no-super-linear-backtracking, regexp/match-any */

// <h1>, optional <p> description, then the packages table
const monorepoHeaderRegex =
  /^<h1 align="center">[^]*?\n<h3>📦 Packages<\/h3>\n[^|]*(?:\|[^\n]*\n)+([^]*)$/;

// <h1>, then the <p> description and badges blocks
const libHeaderRegex =
  /^<h1 align="center">[^]*?<\/h1>\n(?:\s*<p align="center">[^]*?<\/p>\n)+([^]*)$/;

const matchFirst = (content: string, regexes: RegExp[]): string => {
  for (const regex of regexes) {
    const match = regex.exec(content);
    if (match) return (match[1] ?? "").trim();
  }
  return content;
};

/**
 * The hand-written body of a monorepo README, after the generated header. The
 * body is found by matching the header itself, not the first heading.
 */
export const extractMonorepoReadmeContent = (
  readmeFullContent: string,
): string =>
  matchFirst(readmeFullContent, [
    monorepoHeaderRegex,
    // legacy headers
    /^<h1 align="center"[^#*]+([^]+)$/,
    /^<h3 align="center"[^#*]+([^]+)$/,
    /^<h3[^#*]+([^]+)$/,
    /^#[^#*]+([^]+)$/,
  ]);

/** The hand-written body of a lib README, after the generated header. */
export const extractLibReadmeContent = (readmeFullContent: string): string =>
  matchFirst(readmeFullContent, [
    // legacy headers with badges as reference links at the end
    /^<h1 align="center"[^#*]+([^]+)\[npm-image\]:/,
    /^<h1 align="center"[^#*]+([^]+)\[daviddm-image\]:/,
    /^<h3 align="center"[^#*]+([^]+)\[npm-image\]:/,
    /^<h3 align="center"[^#*]+([^]+)\[daviddm-image\]:/,
    libHeaderRegex,
    // legacy headers
    /^<h1 align="center"[^#*]+([^]+)$/,
    /^<h3 align="center"[^#*]+([^]+)$/,
    /^<h3[^#*]+([^]+)$/,
    /^#[^#*]+([^]+)\[npm-image\]:/,
    /^#[^#*]+([^]+)\[daviddm-image\]:/,
    /^#[^#*]+([^]+)$/,
  ]);

/* oxlint-enable regexp/no-super-linear-backtracking, regexp/match-any */

export const appsWithBrowser: readonly AppType[] = [
  "alp",
  "next.js",
  "vite",
  "vite-with-server",
];

const expoTsconfigTarget = "@pob/root/tsconfigs/targets/expo.json";

/**
 * Based on the app type from the pob config rather than on the package.json
 * dependencies, which can change without pob being run again.
 */
export const getAppTsconfigTarget = ({
  appType,
  dom,
  withBun,
}: {
  appType: AppType | undefined;
  dom: boolean;
  withBun: boolean;
}): string | undefined => {
  if (appType === "expo") return expoTsconfigTarget;
  if (dom) {
    return appType === "vite" || appType === "vite-with-server"
      ? "@pob/root/tsconfigs/targets/vite.json"
      : "@pob/root/tsconfigs/targets/webpack.json";
  }
  if (withBun) return "@pob/root/tsconfigs/targets/bun.json";
  return undefined;
};

/**
 * Node backend apps: their scripts run in the same environment as their
 * sources, so the package tsconfig.json type-checks them too instead of a
 * separate tsconfig.tools.json.
 */
export const nodeAppTypes: readonly AppType[] = [
  "node",
  "node-library",
  "alp-node",
];

export const isNodeApp = (config: PobConfig | undefined): boolean =>
  config?.project.type === "app" &&
  !!config.app &&
  nodeAppTypes.includes(config.app.type);

export const isExpoApp = (config: PobConfig | undefined): boolean =>
  config?.project.type === "app" && config.app?.type === "expo";

/** alouette styles components with tailwind (nativewind) and tailwind-variants */
export const detectAlouette = (pkg: JsonObject): boolean =>
  [pkg.dependencies, pkg.devDependencies].some(
    (dependencies) =>
      (dependencies as JsonObject | undefined)?.alouette !== undefined,
  );

/** Fallback on the dependencies for an app config missing the option. */
export const isAlouetteApp = (
  config: PobConfig | undefined,
  pkg: JsonObject,
): boolean =>
  isExpoApp(config) && (config?.app?.alouette ?? detectAlouette(pkg));

const escapeRegExp = (value: string): string =>
  value.replaceAll(/[$()*+.?[\\\]^{|}]/g, String.raw`\$&`);

/**
 * Names of the workspace packages imported by a rollup config (e.g. a rollup
 * plugin): the root rollup config loads them from their build output, so
 * they must be built before it runs. Only packages with a build script.
 */
export const getRollupConfigDependencies = (
  packages: readonly JsonObject[],
  rollupConfigContents: readonly string[],
): string[] =>
  packages
    .filter((pkg) => {
      if (!(pkg.scripts as JsonObject | undefined)?.build) return false;
      const importRegex = new RegExp(
        String.raw`from\s+["']${escapeRegExp(pkg.name as string)}(?:/[^"']*)?["']`,
      );
      return rollupConfigContents.some((content) => importRegex.test(content));
    })
    .map((pkg) => pkg.name as string);

const GENERATED_DOCS_MARKERS = [
  ".nojekyll",
  "assets",
  "index.html",
  "coverage.lcov",
];

/**
 * Whether the legacy "docs" directory (now "generated-docs") still looks
 * generated: a hand-written markdown "docs" directory is kept.
 */
export const isLegacyGeneratedDocs = (
  exists: (filePath: string) => boolean,
): boolean =>
  exists("docs") &&
  GENERATED_DOCS_MARKERS.some((marker) => exists(`docs/${marker}`));
