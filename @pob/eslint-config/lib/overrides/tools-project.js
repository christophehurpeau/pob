// non-published typescript run in place (scripts/**/*.ts, root *.config.ts):
// vitest is resolved from the root of the project. The scripts glob is
// **/scripts/** so it covers both single repos and monorepo package scripts.
/** @type {import("eslint").Linter.Config} */
export default {
  name: "@pob/eslint-config/overrides/tools-project",
  files: ["**/{scripts,e2e}/**/*.{ts,mts,cts}", "*.config.{ts,mts,cts}"],
  settings: {
    "import-x/core-modules": ["vitest"],
  },
};
