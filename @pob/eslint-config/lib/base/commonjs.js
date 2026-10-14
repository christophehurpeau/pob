export default {
  name: "@pob/eslint-config/base/commonjs",
  languageOptions: {
    sourceType: "script",
  },
  rules: {
    strict: ["error", "safe"],

    // https://eslint.org/docs/rules/global-require
    "global-require": "error",
  },
};
