export default {
  name: "@pob/eslint-config/plugins/node",

  rules: {
    // Disable rules already checked by import plugin
    "n/no-unpublished-require": "off",
    "n/no-extraneous-require": "off",
    "n/no-unpublished-import": "off",
    "n/no-extraneous-import": "off",
    "n/no-missing-require": "off",
    "n/no-missing-import": "off",

    // disable no-unsupported-features when using babel
    "n/no-unsupported-features/es-builtins": "off",
    "n/no-unsupported-features/es-syntax": "off",
  },
};
