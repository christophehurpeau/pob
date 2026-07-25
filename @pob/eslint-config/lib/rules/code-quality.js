export default {
  name: "@pob/eslint-config/code-quality",
  rules: {
    // https://eslint.org/docs/rules/complexity
    complexity: ["warn", { max: 20 }],

    // https://eslint.org/docs/rules/max-depth
    "max-depth": ["warn", 6],
  },
};
