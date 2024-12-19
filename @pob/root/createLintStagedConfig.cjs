"use strict";

const fs = require("node:fs");
const path = require("node:path");
const semver = require("semver");
const whichPmRuns = require("which-pm-runs");

const pm =
  whichPmRuns() ||
  (fs.existsSync("package-lock.json") ? { name: "npm" } : undefined);
const isEslintFlatConfig = fs.existsSync("eslint.config.js");

const yarnMajorVersion = pm.name === "yarn" && semver.major(pm.version);
const { lockfile, installAndDedupe } = (() => {
  if (pm.name === "yarn") {
    return {
      lockfile: "yarn.lock",
      installAndDedupe: ["yarn", "yarn dedupe"],
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

// eslint-disable-next-line import/no-dynamic-require
const pkg = require(path.resolve("package.json"));
const workspaces = pkg.workspaces || false;

const getSrcDirectories = () => {
  if (workspaces) {
    return `${
      workspaces.length === 1 ? workspaces[0] : `{${workspaces.join(",")}}`
    }/{src,lib}`;
  }

  return "{src,lib}";
};

// const getDistDirectories = () => {
//   if (workspaces) {
//     return `${
//       workspaces.length === 1 ? workspaces[0] : `{${workspaces.join(',')}}`
//     }/dist`;
//   }

//   return 'dist';
// };

module.exports = function createLintStagedConfig() {
  const srcDirectories = getSrcDirectories();

  return {
    [`{${lockfile},package.json${
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
        packagejsonFilenames.length === 0
          ? undefined
          : `pretty-pkg "${packagejsonFilenames.join('" "')}"`,
        `git add ${lockfile}${
          pm.name === "yarn" && yarnMajorVersion >= 2
            ? " .yarn .yarnrc.yml"
            : ""
        }`,
      ].filter(Boolean);
    },
    "!(package|package-lock|.eslintrc).json": ["prettier --write"],
    ".eslintrc.json": ["pretty-eslint-config"],
    [`{scripts,config,${srcDirectories}}/**/*.{yml,yaml,md}`]: [
      "prettier --write",
    ],
    "./*.{yml,yaml,md}": ["prettier --write"],
    [`${srcDirectories}/**/*.{js,ts,tsx}`]: [
      "prettier --write",
      `eslint --fix --quiet${
        isEslintFlatConfig
          ? ""
          : " --report-unused-disable-directives --resolve-plugins-relative-to ."
      }`,
    ],
    "{scripts,config,.storyboook}/**/*.{js,mjs,cjs}": [
      "prettier --write",
      `eslint --fix --quiet${
        isEslintFlatConfig
          ? ""
          : " --report-unused-disable-directives --resolve-plugins-relative-to ."
      }`,
    ],
    [`{.storybook,${srcDirectories}}/**/*.css`]: [
      "prettier --parser css --write",
    ],
    [`${srcDirectories}/**/*.{ts,tsx}`]: () =>
      pkg.devDependencies && pkg.devDependencies["pob-babel"]
        ? [
            "rollup --config rollup.config.mjs",
            "tsc -b",
            // `git --glob-pathspecs add ${getDistDirectories()}/**/*`,
          ]
        : ["tsc"],
  };
};
