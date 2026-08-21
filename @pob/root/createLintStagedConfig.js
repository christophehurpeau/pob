import fs from "node:fs";
import path from "node:path";
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

const getSrcDirectories = () => {
  if (workspacesPattern) {
    return `${workspacesPattern}/{src,lib}`;
  }

  return "{src,lib}";
};

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

export default function createLintStagedConfig() {
  const srcDirectories = getSrcDirectories();

  return {
    [`{${lockfile},${configfile ? `${configfile},` : ""}package.json${
      workspaces
        ? `,${workspaces.map((workspacePath) => `${workspacePath}/package.json`).join(",")}`
        : ""
    }}`]: (filenames) => {
      const packagejsonFilenames = filenames.filter((filename) =>
        filename.endsWith(".json"),
      );

      return [
        ...installAndDedupe,
        pkg.scripts?.checks ? `${pm.name} run checks` : undefined,
        packagejsonFilenames.length === 0
          ? undefined
          : `oxfmt "${packagejsonFilenames.join('" "')}"`,
        "eslint --fix --quiet",
        `git add ${lockfile}${configfile ? ` ${configfile}` : ""}${pm.name === "yarn" ? " .yarn" : ""}`,
      ].filter(Boolean);
    },
    "!(package|package-lock|.eslintrc).json": [
      "oxfmt --no-error-on-unmatched-pattern",
    ],
    [`{.github,scripts,config,${srcDirectories}}/**/*.{yml,yaml,md}`]: [
      "oxfmt --no-error-on-unmatched-pattern",
    ],
    "./*.{yml,yaml,md,jsonc}": ["oxfmt --no-error-on-unmatched-pattern"],
    [`${srcDirectories}/**/*.{js,ts,tsx}`]: [
      "oxfmt --no-error-on-unmatched-pattern",
      "eslint --fix --quiet",
    ],
    "{scripts,config,.storyboook}/**/*.{js,mjs,cjs}": [
      "oxfmt --no-error-on-unmatched-pattern",
      "eslint --fix --quiet",
    ],
    [`{.storybook,${srcDirectories}}/**/*.css`]: [
      "oxfmt --no-error-on-unmatched-pattern",
    ],
    [getTscTriggerPattern(srcDirectories)]: () =>
      pkg.devDependencies && pkg.devDependencies["@pob/rollup-esbuild"]
        ? ["rollup --config rollup.config.mjs", "tsc -b"]
        : ["tsc"],
  };
}
