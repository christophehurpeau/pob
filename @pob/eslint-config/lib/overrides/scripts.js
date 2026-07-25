export default {
  name: "@pob/eslint-config/overrides/scripts",
  rules: {
    "unicorn/no-process-exit": "off",
    "n/hashbang": "off",
    // allow dev dependencies
    "import-x/no-extraneous-dependencies": ["error", { devDependencies: true }],
  },
};
