export default {
  name: "@pob/eslint-config/base/module",
  languageOptions: {
    sourceType: "module",
  },
  rules: {
    strict: "off",

    // replaced by import/no-duplicates
    "no-duplicate-imports": "off",

    // https://eslint.org/docs/rules/no-restricted-exports
    "no-restricted-exports": [
      "error",
      {
        restrictDefaultExports: {
          direct: false, // permits `export default` declarations
          named: true, // restricts `export { foo as default };` declarations
          defaultFrom: false, // permits `export { default } from 'foo';` declarations
          namedFrom: false, // permits `export { foo as default } from 'foo';` declarations
          namespaceFrom: true, // restricts `export * as default from 'foo';` declarations
        },
        restrictedNamedExports: [
          "then", // this will cause tons of confusion when your module is dynamically `import()`ed, and will break in most node ESM versions
        ],
      },
    ],
  },
};
