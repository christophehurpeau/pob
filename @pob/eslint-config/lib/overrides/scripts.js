/** @type {import("eslint").Linter.Config} */
export default {
  name: "@pob/eslint-config/overrides/scripts",
  rules: {
    "n/hashbang": "off",
    // allow dev dependencies
    "import-x/no-extraneous-dependencies": ["error", { devDependencies: true }],
  },
};
