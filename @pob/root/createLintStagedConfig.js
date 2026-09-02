import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "lint-staged/config";
import picomatch from "picomatch";
import { assertYarnBerry } from "./lib/assert-yarn-berry.js";
import { whichPmRuns } from "./lib/which-pm-runs.js";

const pm = whichPmRuns();

assertYarnBerry(pm);

const { lockfile, configfile, installAndDedupe } = (() => {
  if (pm.name === "yarn") {
    return {
      lockfile: "yarn.lock",
      configfile: ".yarnrc.yml",
      installAndDedupe: [
        // suppress useless error codes and reformat and sort yarnrc.yml.
        `yarn config set logFilters --json '[
    {"code": "YN0002","level": "discard"},
    {"code": "YN0007","level": "discard"},
    {"code": "YN0008","level": "discard"},
    {"code": "YN0013","level": "discard"},
    {"code": "YN0018","level": "discard"},
    {"code": "YN0060","level": "discard"},
    {"code": "YN0061","level": "discard"}
  ]'`,
        "yarn",
        "yarn dedupe",
        "yarn config unset logFilters",
      ],
    };
  }
  if (pm.name === "npm") {
    return {
      lockfile: "package-lock.json",
      installAndDedupe: ["npm install", "npm dedupe"],
    };
  }
  if (pm.name === "bun") {
    return {
      lockfile: "bun.lock",
      installAndDedupe: ["bun i"],
    };
  }
  if (pm.name === "pnpm") {
    return {
      lockfile: "pnpm-lock.yaml",
      installAndDedupe: ["pnpm install", "pnpm dedupe"],
    };
  }

  throw new Error(
    `Package manager not supported: ${pm.name}. Please run with yarn, npm, bun or pnpm !`,
  );
})();

const pkg = JSON.parse(fs.readFileSync(path.resolve("package.json")));
const workspaces = pkg.workspaces || false;

const workspacesPattern = (() => {
  if (!workspaces) return undefined;
  return workspaces.length === 1 ? workspaces[0] : `{${workspaces.join(",")}}`;
})();

const OXFMT = "oxfmt --no-error-on-unmatched-pattern";
const ESLINT_FIX = "eslint --fix --quiet";

const getSrcDirectories = () => {
  if (workspacesPattern) {
    return `${workspacesPattern}/{src,lib}`;
  }

  return "{src,lib}";
};

const getPackageJsonPattern = () =>
  workspaces
    ? `{package.json,${workspaces
        .map((workspacePath) => `${workspacePath}/package.json`)
        .join(",")}}`
    : "package.json";

// Changing the lockfile, the package manager config or any package.json
// requires a reinstall before anything else runs.
const getPmFilesPattern = () =>
  `{${lockfile},${configfile ? `${configfile},` : ""}package.json${
    workspaces
      ? `,${workspaces.map((workspacePath) => `${workspacePath}/package.json`).join(",")}`
      : ""
  }}`;

// tsc must also run when the typescript project layout or the dependencies
// change, not only when a source file changes.
const getTscTriggerPattern = (srcDirectories) =>
  `{${[
    `${srcDirectories}/**/*.{ts,tsx}`,
    "tsconfig*.json",
    "package.json",
    workspacesPattern && `${workspacesPattern}/tsconfig*.json`,
    workspacesPattern && `${workspacesPattern}/package.json`,
  ]
    .filter(Boolean)
    .join(",")}}`;

const getGitAddPmFilesCommand = () =>
  `git add ${lockfile}${configfile ? ` ${configfile}` : ""}${pm.name === "yarn" ? " .yarn" : ""}`;

/**
 * Matches a file against a list of patterns, with the same picomatch options
 * lint-staged itself uses (see lint-staged/lib/matchFiles.js), so both config
 * flavors match the exact same files.
 */
const createMatcher = (patterns) => {
  const matchers = patterns.map((pattern) =>
    picomatch(pattern, {
      dot: true,
      // If the pattern doesn't look like a path, match against the basename in
      // every directory.
      matchBase: !pattern.includes("/"),
      posixSlashes: true,
      strictBrackets: true,
    }),
  );

  return (filename) => matchers.some((isMatch) => isMatch(filename));
};

// lint-staged passes absolute paths unless `relative: true` is set.
const toRelativePosixPath = (filename) =>
  (path.isAbsolute(filename)
    ? path.relative(process.cwd(), filename)
    : filename
  )
    .split(path.sep)
    .join("/");

const withFilenames = (command, filenames) =>
  `${command} "${filenames.join('" "')}"`;

/**
 * Legacy: one entry per pattern group, each running its own oxfmt and eslint on
 * the files it matched. Kept behind POB_LEGACY_LINT_STAGED_CONFIG.
 */
const createLegacyConfig = ({
  buildTasks,
  cssPattern,
  otherJsonPattern,
  pmFilesPattern,
  rootConfigPattern,
  rootFilesPattern,
  configDirsCodePattern,
  srcCodePattern,
  srcDocsPattern,
  tscTriggerPattern,
  workspaceConfigPattern,
}) =>
  defineConfig({
    [pmFilesPattern]: (filenames) => {
      const packagejsonFilenames = filenames.filter((filename) =>
        filename.endsWith(".json"),
      );

      return [
        ...installAndDedupe,
        pkg.scripts?.checks ? `${pm.name} run checks` : undefined,
        packagejsonFilenames.length === 0
          ? undefined
          : withFilenames("oxfmt", packagejsonFilenames),
        ESLINT_FIX,
        getGitAddPmFilesCommand(),
      ].filter(Boolean);
    },
    [otherJsonPattern]: [OXFMT],
    [srcDocsPattern]: [OXFMT],
    [rootFilesPattern]: [OXFMT],
    [srcCodePattern]: [OXFMT, ESLINT_FIX],
    [configDirsCodePattern]: [OXFMT, ESLINT_FIX],
    [rootConfigPattern]: [OXFMT, ESLINT_FIX],
    ...(workspaceConfigPattern && {
      [workspaceConfigPattern]: [OXFMT, ESLINT_FIX],
    }),
    [cssPattern]: [OXFMT],
    // Tasks are declared as functions so that lint-staged does not append the
    // matched filenames: both commands build the whole project.
    [tscTriggerPattern]: buildTasks,
  });

/**
 * A single entry, which builds the command list itself: oxfmt and eslint each
 * run once on all the files they should handle, instead of once per pattern
 * group, and the build runs after them instead of alongside.
 */
const createConfig = ({
  cssPattern,
  hasRollup,
  otherJsonPattern,
  packageJsonPattern,
  pmFilesPattern,
  rootConfigPattern,
  rootFilesPattern,
  configDirsCodePattern,
  srcCodePattern,
  srcDocsPattern,
  tscTriggerPattern,
  workspaceConfigPattern,
}) => {
  const matchesPmFiles = createMatcher([pmFilesPattern]);
  const matchesOxfmt = createMatcher(
    [
      packageJsonPattern,
      otherJsonPattern,
      srcDocsPattern,
      rootFilesPattern,
      srcCodePattern,
      configDirsCodePattern,
      rootConfigPattern,
      workspaceConfigPattern,
      cssPattern,
    ].filter(Boolean),
  );
  const matchesEslint = createMatcher(
    [
      pmFilesPattern,
      srcCodePattern,
      configDirsCodePattern,
      rootConfigPattern,
      workspaceConfigPattern,
    ].filter(Boolean),
  );
  const matchesTscTrigger = createMatcher([tscTriggerPattern]);

  // Build tasks generate their own command so that lint-staged does not append
  // the matched filenames: they build the whole project. They return no command
  // at all when nothing they depend on changed.
  const createBuildTask = (command) => (allStagedFiles) =>
    allStagedFiles.map(toRelativePosixPath).some(matchesTscTrigger)
      ? command
      : [];

  return defineConfig({
    "*": [
      (allStagedFiles) => {
        const filenames = allStagedFiles.map(toRelativePosixPath);
        const hasPmFiles = filenames.some(matchesPmFiles);
        const oxfmtFilenames = filenames.filter(matchesOxfmt);
        const eslintFilenames = filenames.filter(matchesEslint);

        const getEslintCommand = () => {
          // eslint runs on the whole project when a package.json, the lockfile
          // or the package manager config changed, like in the legacy config,
          // as lint rules depend on the dependencies themselves.
          if (hasPmFiles) return ESLINT_FIX;
          if (eslintFilenames.length === 0) return undefined;
          return withFilenames(ESLINT_FIX, eslintFilenames);
        };

        return [
          ...(hasPmFiles ? installAndDedupe : []),
          hasPmFiles && pkg.scripts?.checks
            ? `${pm.name} run checks`
            : undefined,
          oxfmtFilenames.length === 0
            ? undefined
            : withFilenames(OXFMT, oxfmtFilenames),
          getEslintCommand(),
          hasPmFiles ? getGitAddPmFilesCommand() : undefined,
        ].filter(Boolean);
      },
      // Runs after the tasks above, so that the build sees the formatted and
      // fixed files. Both commands build the whole project, in parallel.
      hasRollup
        ? [
            createBuildTask("rollup --config rollup.config.mjs"),
            createBuildTask("tsc -b"),
          ]
        : createBuildTask("tsc"),
    ],
  });
};

export default function createLintStagedConfig() {
  const srcDirectories = getSrcDirectories();

  const hasRollup = Boolean(
    pkg.devDependencies && pkg.devDependencies["@pob/rollup-esbuild"],
  );

  const rootConfigPattern = "./*.{js,mjs,cjs,ts}";
  const workspaceConfigPattern = workspacesPattern
    ? `${workspacesPattern}/*.{js,mjs,cjs,ts}`
    : undefined;

  const patterns = {
    buildTasks: hasRollup
      ? [[() => "rollup --config rollup.config.mjs", () => "tsc -b"]] // run in parallel
      : [() => "tsc"],
    cssPattern: `{.storybook,${srcDirectories}}/**/*.css`,
    hasRollup,
    otherJsonPattern: "!(package|package-lock|.eslintrc).json",
    packageJsonPattern: getPackageJsonPattern(),
    pmFilesPattern: getPmFilesPattern(),
    rootConfigPattern,
    rootFilesPattern: "./*.{yml,yaml,md,jsonc}",
    configDirsCodePattern: "{scripts,config,.storybook}/**/*.{js,mjs,cjs}",
    srcCodePattern: `${srcDirectories}/**/*.{js,ts,tsx}`,
    srcDocsPattern: `{.github,scripts,config,${srcDirectories}}/**/*.{yml,yaml,md}`,
    tscTriggerPattern: getTscTriggerPattern(srcDirectories),
    workspaceConfigPattern,
  };

  return process.env.POB_LEGACY_LINT_STAGED_CONFIG
    ? createLegacyConfig(patterns)
    : createConfig(patterns);
}
