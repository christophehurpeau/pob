// non-published typescript run in place (scripts/**/*.ts, root *.config.ts) is
// not part of the emitting tsconfig.json, so it uses the dedicated
// tsconfig.tools.json project for type-aware linting
export default {
  name: "@pob/eslint-config/overrides/tools-project",
  files: ["scripts/**/*.{ts,mts,cts}", "*.config.{ts,mts,cts}"],
  languageOptions: {
    parserOptions: {
      project: "tsconfig.tools.json",
    },
  },
  settings: {
    "import-x/core-modules": ["vitest"],
  },
};
