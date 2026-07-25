import json from "@eslint/json";

export default [
  // json plugin
  {
    name: "@pob/eslint-config/base/languages/json/plugins",
    plugins: { json },
  },

  // lint JSON files
  {
    // name: "@pob/eslint-config/base/languages/json/json",
    files: ["**/*.json"],
    language: "json/json",
    // @ts-ignore
    ...json.configs.recommended,
  },

  // lint JSONC files
  {
    // name: "@pob/eslint-config/base/languages/json/jsonc",
    files: ["**/*.jsonc", "**/tsconfig.json", ".vscode/*.json"],
    language: "json/jsonc",
    languageOptions: {
      allowTrailingCommas: true,
    },
    // @ts-ignore
    ...json.configs.recommended,
  },

  // lint JSON5 files
  {
    // name: "@pob/eslint-config/base/languages/json/json5",
    files: ["**/*.json5"],
    language: "json/json5",
    // @ts-ignore
    ...json.configs.recommended,
  },
];
