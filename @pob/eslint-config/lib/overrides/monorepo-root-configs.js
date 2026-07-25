// root config files written in typescript (e.g. vitest.config.ts) are not part
// of any package tsconfig, so they use the dedicated tsconfig.root-configs.json
// project for type-aware linting
export default {
  name: "@pob/eslint-config/overrides/monorepo-root-configs",
  files: ["*.config.{ts,mts,cts}"],
  languageOptions: {
    parserOptions: {
      project: "tsconfig.root-configs.json",
    },
  },
  settings: {
    "import-x/core-modules": ["vitest"],
  },
};
