import checkPackageDependenciesConfigs from "./languages/check-package-dependencies.js";
import jsonConfigs from "./languages/json.js";

// every other rule of JS and TS files is checked by oxlint, see oxlint/*.json
/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    name: "@pob/eslint-config/base/linterOptions",
    linterOptions: {
      // todo noInlineConfig: true,
      reportUnusedDisableDirectives: "error",
      reportUnusedInlineConfigs: "error",
    },
  },
  {
    name: "@pob/eslint-config/base/ignores",
    ignores: [
      ".yarn",
      "**/dist/",
      "**/build/",
      "**/coverage/",
      "**/.next/",
      "**/.tamagui/",
      "**/.expo/",
      "**/*.d.ts",
    ],
  },
  ...jsonConfigs,
  ...checkPackageDependenciesConfigs,
  {
    name: "@pob/eslint-config/base/code",
    files: ["**/*.{js,cjs,mjs,ts,cts,mts,tsx}"],
    rules: {
      // oxlint reports the BOM at offset 0, where no directive can disable it
      // https://eslint.org/docs/rules/unicode-bom
      "unicode-bom": ["error", "never"],
    },
  },
  {
    name: "@pob/eslint-config/base/js",
    files: ["**/*.{js,cjs,mjs}"],
    rules: {
      // oxlint ignores /* global */ comments and does not declare undefined.
      // TypeScript files are checked by tsc.
      // https://eslint.org/docs/rules/no-undef
      "no-undef": "error",
    },
  },
];
