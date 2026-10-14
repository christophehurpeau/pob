/** @type {import("eslint").Linter.Config} */
export default {
  name: "@pob/eslint-config/test",
  rules: {
    // allow dev dependencies
    "import-x/no-extraneous-dependencies": ["error", { devDependencies: true }],
  },
};
