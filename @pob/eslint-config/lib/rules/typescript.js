import { createNodeResolver } from "eslint-plugin-import-x";

export default {
  name: "@pob/eslint-config/typescript",
  languageOptions: {
    parserOptions: {
      project: true,
    },
  },
  settings: {
    "import-x/resolver-next": [
      createNodeResolver({
        extensions: [".mjs", ".js", ".json", ".ts"],
        conditionNames: ["import"],
      }),
    ],
    "import-x/extensions": [".js", ".mjs", ".ts", ".d.ts"],
  },
  rules: {
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/import/no-anonymous-default-export.md
    // Reports if a module's default export is unnamed
    "import-x/no-anonymous-default-export": [
      "error",
      {
        allowArray: true,
        allowArrowFunction: false,
        allowAnonymousClass: false,
        allowAnonymousFunction: false,
        allowCallExpression: true,
        allowLiteral: true,
        allowObject: true,
      },
    ],

    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/import/extensions.md
    "import-x/extensions": [
      "error",
      "always",
      {
        ignorePackages: true,
        pattern: {
          js: "always",
          cjs: "always",
          mjs: "always",
          cts: "always",
          mts: "always",
          ts: "always",
        },
      },
    ],

    /* issues */

    // http://eslint.org/docs/rules/spaced-comment
    // conflicts with typescript triple slash
    "spaced-comment": "off",

    /* some exported type doesnt work. tsc check that anyway */
    "import-x/named": "off",
  },
};
