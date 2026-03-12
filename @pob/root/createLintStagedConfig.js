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

  throw new Error(
    `Package manager not supported: ${pm.name}. Please run with yarn, npm or bun !`,
  );
})();

const pkg = JSON.parse(fs.readFileSync(path.resolve("package.json")));
const workspaces = pkg.workspaces || false;

const getSrcDirectories = () => {
  if (workspaces) {
    return `${
      workspaces.length === 1 ? workspaces[0] : `{${workspaces.join(",")}}`
    }/{src,lib}`;
  }

  return "{src,lib}";
};

export default function createLintStagedConfig() {
  const srcDirectories = getSrcDirectories();

  return {
    [`{${lockfile},${configfile ? `${configfile},` : ""}package.json${
      workspaces
        ? `,${workspaces
            .map((workspacePath) => `${workspacePath}/package.json`)
            .join(",")}`
        : ""
    }}`]: (filenames) => {
      const packagejsonFilenames = filenames.filter((filename) =>
        filename.endsWith(".json"),
      );

      return [
        ...installAndDedupe,
        pkg.scripts?.checks ? `${pm.name} run checks` : undefined,
        "eslint --fix --quiet",
        packagejsonFilenames.length === 0
          ? undefined
          : `pretty-pkg "${packagejsonFilenames.join('" "')}"`,
        `git add ${lockfile}${configfile ? ` ${configfile}` : ""}${pm.name === "yarn" ? " .yarn" : ""}`,
      ].filter(Boolean);
    },
    "!(package|package-lock|.eslintrc).json": ["prettier --write"],
    [`{.github,scripts,config,${srcDirectories}}/**/*.{yml,yaml,md}`]: [
      "prettier --write",
    ],
    "./*.{yml,yaml,md}": ["prettier --write"],
    [`${srcDirectories}/**/*.{js,ts,tsx}`]: [
      "prettier --write",
      "eslint --fix --quiet",
    ],
    "{scripts,config,.storyboook}/**/*.{js,mjs,cjs}": [
      "prettier --write",
      "eslint --fix --quiet",
    ],
    [`{.storybook,${srcDirectories}}/**/*.css`]: [
      "prettier --parser css --write",
    ],
    [`${srcDirectories}/**/*.{ts,tsx}`]: () =>
      pkg.devDependencies && pkg.devDependencies["@pob/rollup-esbuild"]
        ? ["rollup --config rollup.config.mjs", "tsc -b"]
        : ["tsc"],
  };
}
