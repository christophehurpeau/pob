export default {
  name: "@pob/eslint-config/base/commonjs",
  languageOptions: {
    sourceType: "script",
  },
  rules: {
    strict: ["error", "safe"],

    // https://eslint.org/docs/rules/global-require
    "global-require": "error",

    // disallow use of new operator with the require function
    "no-new-require": "error",
  },
};
