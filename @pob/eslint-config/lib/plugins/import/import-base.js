import importPlugin, { createNodeResolver } from "eslint-plugin-import-x";

export default [
  importPlugin.flatConfigs.recommended,
  {
    name: "@pob/eslint-config/import/base",
    // override recommended language options
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
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
      // disable in recommended
      "import-x/default": "off",

      // https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-unresolved.md
      "import-x/no-unresolved": [
        "error",
        { commonjs: true, caseSensitive: true },
      ],

      // https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/named.md
      "import-x/named": "error",

      // https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/export.md
      "import-x/export": "error",

      // https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-named-as-default.md
      "import-x/no-named-as-default": "error",

      // https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-named-as-default-member.md
      "import-x/no-named-as-default-member": "error",

      // https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-deprecated.md
      "import-x/no-deprecated": "off",

      // https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-extraneous-dependencies.md
      "import-x/no-extraneous-dependencies": "error",

      // https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-mutable-exports.md
      "import-x/no-mutable-exports": "error",

      // https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-amd.md
      "import-x/no-amd": "error",

      // https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/first.md
      "import-x/first": "error",

      // https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-duplicates.md
      "import-x/no-duplicates": "error",

      // https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/newline-after-import.md
      "import-x/newline-after-import": "error",

      // https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/prefer-default-export.md
      "import-x/prefer-default-export": "off",

      // https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-absolute-path.md
      "import-x/no-absolute-path": "error",

      // https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-dynamic-require.md
      "import-x/no-dynamic-require": "error",

      // https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-webpack-loader-syntax.md
      "import-x/no-webpack-loader-syntax": "error",

      // https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-named-default.md
      "import-x/no-named-default": "error",

      // https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-self-import.md
      "import-x/no-self-import": "error",

      // https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-cycle.md
      "import-x/no-cycle": ["error", { maxDepth: "∞" }],

      // https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-useless-path-segments.md
      "import-x/no-useless-path-segments": ["error", { commonjs: true }],

      // https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-import-module-exports.md
      "import-x/no-import-module-exports": "error",

      // https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-relative-packages.md
      "import-x/no-relative-packages": "error",

      // https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-empty-named-blocks.md
      "import-x/no-empty-named-blocks": "error",

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
      // https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-relative-packages.md
      "import-x/no-relative-packages": "off",

      // https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/order.md
      "import-x/order": "off",
    },
  },

  {
    name: "@pob/eslint-config/import/typescript",
    files: ["*.ts"],
    rules: {
      // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/consistent-type-specifier-style.md
      "import-x/consistent-type-specifier-style": "error",
    },
  },
];
