import { createNodeResolver, flatConfigs } from "eslint-plugin-import-x";

// import-x rules depend on the resolver settings, JS objects .oxlintrc.json
// cannot express: they stay in eslint
/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    name: "@pob/eslint-config/import",
    files: ["**/*.{js,cjs,mjs,ts,cts,mts,tsx}"],
    plugins: flatConfigs.recommended.plugins,
    settings: {
      "import-x/extensions": [".js", ".mjs"],
      "import-x/ignore": ["node_modules"],
      "import-x/parsers": {
        // https://github.com/un-ts/eslint-plugin-import-x/issues/2556#issuecomment-1419518561
        espree: [".js", ".cjs", ".mjs"],
        "@typescript-eslint/parser": [".ts"],
      },
      "import-x/resolver-next": [createNodeResolver()],
    },
    rules: {
      // https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-unresolved.md
      "import-x/no-unresolved": [
        "error",
        { commonjs: true, caseSensitive: true },
      ],

      // https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/export.md
      "import-x/export": "error",

      // https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-extraneous-dependencies.md
      "import-x/no-extraneous-dependencies": "error",

      // https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-useless-path-segments.md
      "import-x/no-useless-path-segments": ["error", { commonjs: true }],

      // https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-import-module-exports.md
      "import-x/no-import-module-exports": "error",

      // https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-relative-packages.md
      "import-x/no-relative-packages": "error",

      // https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/order.md
      "import-x/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          alphabetize: { order: "asc", caseInsensitive: false },
          "newlines-between": "never",
        },
      ],
    },
  },
  {
    name: "@pob/eslint-config/import/rollup-config",
    files: ["rollup.config.js", "rollup.config.mjs"],
    rules: {
      "import-x/no-relative-packages": "off",
      "import-x/order": "off",
    },
  },
];
