/** @type {import("eslint").Linter.Config} */
export default {
  name: "@pob/eslint-config/test",
  // in a monorepo, vitest is a dependency of the root, not of each package
  settings: {
    "import-x/core-modules": ["vitest"],
  },
  rules: {
    // allow dev dependencies
    "import-x/no-extraneous-dependencies": ["error", { devDependencies: true }],
  },
};
