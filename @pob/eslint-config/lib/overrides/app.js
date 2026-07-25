export default {
  name: "@pob/eslint-config/overrides/app",
  rules: {
    /* No need for this rule in an app */
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
  },
};
