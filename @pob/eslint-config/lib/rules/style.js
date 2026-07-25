export default {
  name: "@pob/eslint-config/style",
  rules: {
    // changed properties: 'never' to properties: 'always' ; true to 'ignoreDestructuring': false
    // http://eslint.org/docs/rules/camelcase
    camelcase: ["error", { properties: "always", ignoreDestructuring: false }],

    // http://eslint.org/docs/rules/object-shorthand
    "object-shorthand": ["error", "always"],

    // https://github.com/prettier/eslint-config-prettier#curly
    // prettier doesn't enforce {} with multiline
    curly: ["warn", "multi-line"],

    // https://github.com/prettier/eslint-config-prettier#quotes
    // prettier doesn't change backtick to single
    quotes: [
      "warn",
      "double",
      { avoidEscape: true, allowTemplateLiterals: false },
    ],

    // https://eslint.org/docs/latest/rules/sort-imports ; declaration is sorted using import/order
    "sort-imports": ["error", { ignoreDeclarationSort: true }],

    /* disabled rules */

    // http://eslint.org/docs/rules/no-else-return
    "no-else-return": "off",

    // http://eslint.org/docs/rules/arrow-body-style
    "arrow-body-style": "off",
  },
};
