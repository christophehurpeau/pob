import type { PackageContext } from "../../engine/context.ts";
import type { JsonObject } from "../../engine/model.ts";
import { defineStep } from "../../engine/step.ts";
import type { LegacyPart } from "../legacy/part.ts";

const getInitialName = (ctx: PackageContext): string | undefined =>
  ctx.initial.readJson<JsonObject>("package.json")?.name as string | undefined;

/** from the default() of pob (PobBaseGenerator) */
export const pobBaseLegacyPart: LegacyPart = {
  name: "pob",
  writes: [
    "files:Makefile",
    "files:.commitrc.js",
    "pkg.devDependencies",
    "pkg.commitlint",
    "pkg.husky",
  ],
  run: (ctx) => {
    ctx.output.removed("Makefile");
    ctx.output.removed(".commitrc.js");
    // the .git-hooks and git-hooks directories of packages are kept: the
    // yeoman generator checked them with fs.exists, false for a directory
    if (!ctx.facts.inMonorepo) return;
    ctx.pkg.removeDevDependencies([
      "standard-version",
      "yarnhook",
      "lerna",
      "@pob/lerna-light",
    ]);
    ctx.pkg.delete("commitlint");
    ctx.pkg.delete("husky");
  },
};

/** from pob:core:vscode: the code-workspace file of old monorepo roots */
export const vscodeLegacyPart: LegacyPart = {
  name: "vscode",
  writes: ["files:.vscode/*.code-workspace"],
  run: (ctx) => {
    if (!ctx.facts.isMonorepoRoot) return;
    const projectName = (getInitialName(ctx) ?? "").replace("/", "-");
    ctx.output.removed(`.vscode/${projectName}.code-workspace`);
  },
};

/**
 * Git hooks, lint-staged and the release tooling run from the monorepo root:
 * a package does not configure nor depend on them. The pob package itself
 * depends on @pob/root.
 */
export const monorepoPackageToolingStep = defineStep<PackageContext>({
  name: "monorepo-package-tooling",
  when: (ctx) => !!ctx.facts.inMonorepo,
  writes: [
    "pkg.devDependencies.husky",
    "pkg.devDependencies.repository-check-dirty",
    "pkg.devDependencies.@pob/root",
    "pkg.lint-staged",
  ],
  run: (ctx) => {
    ctx.pkg.removeDevDependencies([
      "repository-check-dirty",
      "husky",
      getInitialName(ctx) !== "pob" && "@pob/root",
    ]);
    ctx.pkg.delete("lint-staged");
  },
});
