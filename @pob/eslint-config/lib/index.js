import fs from "node:fs";
import path from "node:path";
import baseConfigs from "./_base.js";
import { createNodeConfigs } from "./node.js";
import devOnlyConfig from "./overrides/dev-only.js";
import scriptsOverrideConfig from "./overrides/scripts.js";
import testOverrideConfig from "./overrides/test.js";
import toolsProjectConfig from "./overrides/tools-project.js";
import importConfigs from "./plugins/import.js";
import typescriptConfigs, { tsExtensions } from "./typescript.js";
import { apply } from "./utils/apply.js";

// eslint only runs what oxlint cannot: JSON files, import-x rules (resolver
// settings), no-undef, unicode-bom, strict and n/hashbang. Every other rule is
// in oxlint/*.json, extended by the project's .oxlintrc.json.

export { apply } from "./utils/apply.js";
export { tsExtensions } from "./typescript.js";

export const applyTs = (options) =>
  apply({
    extensions: tsExtensions,
    ...options,
  });

// .js files are CommonJS in packages with "type": "commonjs", like pob
// generates them
const packageJsonPath = path.resolve("package.json");
const isCommonjsPackage =
  fs.existsSync(packageJsonPath) &&
  // oxlint-disable-next-line unicorn-js/prefer-json-parse-buffer
  JSON.parse(fs.readFileSync(packageJsonPath, "utf8")).type === "commonjs";

const moduleFiles = isCommonjsPackage
  ? ["**/*.{mjs,mts,ts,tsx}"]
  : ["**/*.{js,mjs,mts,ts,tsx}"];
const commonjsFiles = isCommonjsPackage
  ? ["**/*.{js,cjs,cts}"]
  : ["**/*.{cjs,cts}"];

const scriptsModuleFiles = isCommonjsPackage
  ? ["**/scripts/**/*.mjs"]
  : ["**/scripts/**/*.{js,mjs}"];
const scriptsCommonjsFiles = isCommonjsPackage
  ? ["**/scripts/**/*.{js,cjs}"]
  : ["**/scripts/**/*.cjs"];

const testFiles = [
  `**/*.{test,test-e2e,spec}.{js,cjs,mjs,${tsExtensions.slice(1, -1)}}`,
  `**/{__tests__,__mocks__}/**/*.{js,cjs,mjs,${tsExtensions.slice(1, -1)}}`,
];

/** @type {import("eslint").Linter.Config[]} */
const baseModule = [
  ...baseConfigs,
  ...importConfigs,
  {
    name: "@pob/eslint-config/module",
    files: moduleFiles,
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
  {
    name: "@pob/eslint-config/commonjs",
    files: commonjsFiles,
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
    },
    rules: {
      // https://eslint.org/docs/rules/strict
      strict: ["error", "safe"],
    },
  },
  ...typescriptConfigs,
  devOnlyConfig,
  {
    ...testOverrideConfig,
    files: testFiles,
  },
];

/** @type {import("eslint").Linter.Config[]} */
const scriptsOverrideConfigs = [
  {
    ...scriptsOverrideConfig,
    files: [...scriptsModuleFiles, ...scriptsCommonjsFiles],
  },
];

/** @type {import("eslint").Linter.Config[]} */
const toolsProjectConfigs = [toolsProjectConfig];

export default {
  configs: {
    // scripts run in node
    baseModule: [
      ...baseModule,
      ...createNodeConfigs(scriptsModuleFiles, scriptsCommonjsFiles),
      ...scriptsOverrideConfigs,
    ],
    node: [
      ...baseModule,
      ...createNodeConfigs(moduleFiles, commonjsFiles),
      ...scriptsOverrideConfigs,
    ],

    monorepo: toolsProjectConfigs,
    toolsProject: toolsProjectConfigs,
  },
};
