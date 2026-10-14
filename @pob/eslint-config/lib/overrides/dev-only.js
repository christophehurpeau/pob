// JS files outside of src/ and lib/: configs, scripts, ...
/** @type {import("eslint").Linter.Config} */
export default {
  name: "@pob/eslint-config/dev-only",
  files: ["**/*.{js,cjs,mjs}"],
  ignores: ["**/{src,lib}/*.{js,cjs,mjs}"],
  rules: {
    "import-x/no-extraneous-dependencies": ["error", { devDependencies: true }],
  },
};
