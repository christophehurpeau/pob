import { lstatSync } from "node:fs";
import path from "node:path";
import type { PackageContext } from "../../engine/context.ts";
import type { LegacyPart } from "../legacy/part.ts";
import { composesHusky, getInitialPackageName } from "./settings.ts";

const oldGitHooks = [
  "prepare-commit-msg",
  "post-checkout",
  "post-merge",
  "pre-commit",
];

/**
 * InitialFiles cannot tell a symbolic link from a file: old pob versions
 * linked `.git/hooks/pre-commit` to `.git-hooks/pre-commit`.
 */
const isSymbolicLink = (ctx: PackageContext, filePath: string): boolean => {
  try {
    return lstatSync(path.join(ctx.dir, filePath)).isSymbolicLink();
  } catch {
    return false;
  }
};

/** from pob:common:husky */
export const huskyLegacyPart: LegacyPart = {
  name: "husky",
  writes: [
    "pkg.devDependencies",
    "pkg.scripts",
    "pkg.husky",
    "pkg.lint-staged",
    "files:git-hooks",
    "files:.git-hooks",
    "files:.git/hooks/*",
    "files:.huskyrc.js",
    "files:husky.config.js",
    "files:lint-staged.config.cjs",
    "files:lint-staged.config.js",
  ],
  run: (ctx) => {
    if (!composesHusky(ctx)) return;
    const { pkg, output } = ctx;
    const name = getInitialPackageName(ctx);

    // git does not keep empty directories: an empty one is not a leftover
    if (ctx.initial.listFiles("git-hooks").length > 0) {
      output.removed("git-hooks");
    }
    if (isSymbolicLink(ctx, ".git/hooks/pre-commit")) {
      for (const hook of oldGitHooks) output.removed(`.git/hooks/${hook}`);
      output.removed(".git-hooks");
    }
    output.removed(".huskyrc.js");
    output.removed("husky.config.js");

    const lintStagedCjs = ctx.initial.read("lint-staged.config.cjs");
    if (lintStagedCjs !== undefined) {
      output.removed("lint-staged.config.cjs");
      // everywhere else, the husky step generates the config or none is wanted
      if (ctx.facts.isRoot && name === "pob-monorepo") {
        output.owned("lint-staged.config.js", lintStagedCjs);
      }
    }

    pkg.removeDevDependencies(["husky", "@pob/commitlint-config"]);
    if (ctx.facts.isRoot && name !== "pob-monorepo") {
      pkg.removeDevDependencies(["@pob/repo-config", "repository-check-dirty"]);
    }

    pkg.removeScripts([
      "commitmsg",
      "precommit",
      "prepublish",
      "preparecommitmsg",
      "postcheckout",
      "postmerge",
      "postrewrite",
      "postpublish",
    ]);
    pkg.delete("lint-staged");
    pkg.delete("husky");
  },
};

/** from pob:common:release */
export const releaseLegacyPart: LegacyPart = {
  name: "release",
  writes: [
    "pkg.devDependencies",
    "pkg.scripts",
    "files:.github/workflows/publish.yml",
    "files:.github/workflows/release-please.yml",
    "files:.release-please-manifest.json",
  ],
  run: ({ pkg, output }) => {
    output.removed(".github/workflows/publish.yml");
    output.removed(".github/workflows/release-please.yml");
    output.removed(".release-please-manifest.json");
    pkg.removeDevDependencies(["standard-version"]);
    pkg.removeScripts(["release"]);
    if (pkg.get("scripts.version") === "pob-version") {
      pkg.removeScripts(["version"]);
    }
  },
};

/** from pob:common:remove-old-dependencies */
export const oldDependenciesLegacyPart: LegacyPart = {
  name: "old-dependencies",
  writes: ["pkg.dependencies", "pkg.devDependencies"],
  run: (ctx) => {
    const { pkg } = ctx;
    pkg.removeDependencies(["flow-runtime"]);
    pkg.removeDevDependencies([
      "@pob/eslint-config-typescript",
      "ts-node",
      "tcomb",
      "tcomb-forked",
      "flow-runtime",
      "flow-bin",
      "springbokjs-library",
      "babel-preset-es2015",
      "babel-preset-es2015-webpack",
      "babel-preset-es2015-node5",
      "babel-preset-es2015-node6",
      "babel-preset-pob",
      "babel-preset-latest",
      "babel-preset-latest-node",
      "babel-preset-stage-0",
      "babel-preset-stage-1",
      "babel-preset-modern-browsers-stage-1",
      "babel-preset-flow",
      "babel-preset-flow-tcomb",
      "babel-preset-flow-tcomb-forked",
      "babel-plugin-typecheck",
      "babel-plugin-defines",
      "babel-plugin-import-rename",
      "babel-plugin-discard-module-references",
      "babel-plugin-remove-dead-code",
      "babel-plugin-react-require",
      "babel-preset-react",
      "babel-preset-pob-react",
      "komet",
      "komet-karma",
      "@commitlint/cli",
      "@commitlint/config-conventional",
      "lint-staged",
      "yarnhook",
      // in @pob/root
      "yarn-deduplicate",
      // replaced by yarn dedupe
      "yarn-berry-deduplicate",
      "yarn-update-lock",
      "pob-release",
      "eslint-plugin-typescript",
      "xunit-file",
      "rollup-plugin-copy",
      "jest",
      "@types/jest",
      "jest-junit-reporter",
    ]);
    if (getInitialPackageName(ctx) !== "pob-monorepo") {
      pkg.removeDevDependencies(["@pob/version"]);
    }
  },
};
