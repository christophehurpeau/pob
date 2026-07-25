export default {
  name: "@pob/eslint-config/typescript-eslint/replace-unicorn",

  /* Replace unicorn rules by better type-aware typescript-eslint rules */
  rules: {
    "unicorn/prefer-string-starts-ends-with": "off",
    "unicorn/prefer-string-slice": "off",
    "@typescript-eslint/prefer-string-starts-ends-with": "error",

    "unicorn/prefer-array-find": "off",
    "@typescript-eslint/prefer-find": "error",
  },
};
