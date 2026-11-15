/**
 * Frozen cleanup of what older pob versions generated: files, package.json
 * keys and dependencies. Only grows: pob must converge any old project.
 *
 * Grouped by the yeoman generator that held the cleanup.
 */
import type { PackageContext } from "../engine/context.ts";
import type { JsonObject } from "../engine/model.ts";
import { defineStep } from "../engine/step.ts";
import { getLibSettings, getProjectKind } from "./settings.ts";

/** pob:common:format-lint */
const cleanLegacyLint = (ctx: PackageContext): void => {
  const { pkg, output } = ctx;
  const name = (ctx.initial.readJson<JsonObject>("package.json")?.name ??
    "") as string;
  output.removed(".eslintignore");
  output.removed(".prettierignore");
  pkg.removeScripts([
    "postmerge",
    "postcheckout",
    "postrewrite",
    "precommit",
    "commitmsg",
    "preparecommitmsg",
    "prepublish",
    "postpublish",
    "typescript-check",
    "lint:prettier",
    "lint:prettier:fix",
  ]);
  pkg.delete("standard");
  pkg.delete("prettier");
  pkg.removeDevDependencies([
    "@pob/eslint-config-babel",
    "@pob/eslint-config-babel-node",
    "@pob/eslint-config-node",
    "@pob/eslint-config-typescript",
    "@pob/eslint-config-typescript-node",
    "babel-eslint",
    "eslint-config-pob",
    "typescript-eslint-parser",
    "standard",
    "eslint-import-resolver-node",
  ]);
  if (!name.startsWith("@pob/eslint-config")) {
    pkg.removeDevDependencies([
      "eslint-plugin-jsx-a11y",
      "eslint-config-airbnb",
      "eslint-config-airbnb-base",
      "eslint-config-prettier",
      "eslint-plugin-babel",
      "eslint-plugin-flowtype",
      "eslint-plugin-prefer-class-properties",
      "eslint-plugin-prettier",
      "eslint-plugin-react",
      "eslint-plugin-react-hooks",
    ]);
  }
  output.removed(".eslintrc");
  output.removed(".eslintrc.yml");
  output.removed(".eslintrc.js");
  output.removed(".eslintrc.json");
  const useTypescript =
    getProjectKind(ctx) === "lib"
      ? getLibSettings(ctx.config).withTypescript
      : true;
  output.removed(`${useTypescript ? "src" : "lib"}/.eslintrc.json`);
};

export const legacyStep = defineStep<PackageContext>({
  name: "legacy",
  writes: [
    "pkg.scripts",
    "pkg.standard",
    "pkg.prettier",
    "pkg.devDependencies",
    "files:.eslintignore",
    "files:.prettierignore",
    "files:.eslintrc*",
    "files:*/.eslintrc.json",
  ],
  run: (ctx) => {
    cleanLegacyLint(ctx);
  },
});
