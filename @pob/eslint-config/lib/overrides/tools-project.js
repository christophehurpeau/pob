// non-published typescript run in place (scripts/**/*.ts, root *.config.ts) is
// not part of any emitting tsconfig.json, so it uses the dedicated
// tsconfig.tools.json project for type-aware linting. The scripts glob is
// **/scripts/** so it covers both single repos and monorepo package scripts
// (packages/*/scripts, @scope/*/scripts, ...) against the root tools project.
export default {
  name: "@pob/eslint-config/overrides/tools-project",
  files: ["**/{scripts,e2e}/**/*.{ts,mts,cts}", "*.config.{ts,mts,cts}"],
  languageOptions: {
    parserOptions: {
      project: "tsconfig.tools.json",
    },
  },
  settings: {
    "import-x/core-modules": ["vitest"],
  },
};
