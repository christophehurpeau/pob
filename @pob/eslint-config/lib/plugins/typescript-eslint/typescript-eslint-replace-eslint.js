import pobBestPracticesConfig from "@pob/eslint-config/lib/rules/best-practices";
import pobCodeQualityConfig from "@pob/eslint-config/lib/rules/code-quality";
import pobErrorsConfig from "@pob/eslint-config/lib/rules/errors";
import pobStyleConfig from "@pob/eslint-config/lib/rules/style";

const getRuleValue = (config, ruleName) => {
  const value = config[ruleName];
  if (value == null) {
    throw new Error(`getRuleValue: missing value for rule "${ruleName}"`);
  }

  return value;
};

const replaceRules = (config, ruleNames) => {
  return Object.fromEntries(
    ruleNames.flatMap((ruleName) => [
      [ruleName, "off"],
      [`@typescript-eslint/${ruleName}`, getRuleValue(config, ruleName)],
    ]),
  );
};

const disabledRules = (ruleNames) => {
  return Object.fromEntries(
    ruleNames.map((ruleName) => {
      [
        pobBestPracticesConfig.rules,
        pobCodeQualityConfig.rules,
        pobErrorsConfig.rules,
        pobStyleConfig.rules,
      ].forEach((config) => {
        const value = config[ruleName];
        if (value != null && value !== "off") {
          throw new Error(`disabledRules: value for rule "${ruleName}" exists`);
        }
      });
      return [ruleName, "off"];
    }),
  );
};

const disableRules = (ruleNames) => {
  return Object.fromEntries(ruleNames.map((ruleName) => [ruleName, "off"]));
};

export default {
  name: "@pob/eslint-config/typescript-eslint/replace-eslint",
  /* Replace enabled rules in Airbnb by typescript-eslint rules */
  rules: {
    ...replaceRules(pobBestPracticesConfig.rules, [
      // https://typescript-eslint.io/rules/default-param-last
      "default-param-last",
      // https://typescript-eslint.io/rules/dot-notation
      "dot-notation",
      // https://typescript-eslint.io/rules/no-array-constructor
      "no-array-constructor",
      // https://typescript-eslint.io/rules/no-dupe-class-members
      "no-dupe-class-members",
      // https://typescript-eslint.io/rules/no-empty-function
      "no-empty-function",
      // https://typescript-eslint.io/rules/no-implied-eval
      "no-implied-eval",
      // https://typescript-eslint.io/rules/no-loop-func
      "no-loop-func",
      // https://typescript-eslint.io/rules/no-unused-expressions
      "no-unused-expressions",
      // https://typescript-eslint.io/rules/no-unused-vars
      "no-unused-vars",
      // https://typescript-eslint.io/rules/no-use-before-define
      "no-use-before-define",
      // https://typescript-eslint.io/rules/no-useless-constructor
      "no-useless-constructor",
      // https://typescript-eslint.io/rules/require-await
      "require-await",
      // https://typescript-eslint.io/rules/consistent-return
      "consistent-return",
      // https://typescript-eslint.io/rules/class-methods-use-this
      "class-methods-use-this",
      // https://typescript-eslint.io/rules/max-params
      "max-params",
    ]),

    ...disabledRules([
      // https://typescript-eslint.io/rules/brace-style
      "brace-style",
      // https://typescript-eslint.io/rules/comma-dangle
      "comma-dangle",
      // https://typescript-eslint.io/rules/comma-spacing
      "comma-spacing",
      // https://typescript-eslint.io/rules/func-call-spacing
      "func-call-spacing",
      // https://typescript-eslint.io/rules/indent
      "indent",
      // https://typescript-eslint.io/rules/init-declarations
      "init-declarations",
      // https://typescript-eslint.io/rules/keyword-spacing
      "keyword-spacing",
      // https://typescript-eslint.io/rules/lines-between-class-members
      "lines-between-class-members",
      // https://typescript-eslint.io/rules/no-magic-numbers
      "no-magic-numbers",
      // https://typescript-eslint.io/rules/no-restricted-imports
      "no-restricted-imports",
      // https://typescript-eslint.io/rules/no-shadow
      "no-shadow",
      // https://typescript-eslint.io/rules/object-curly-spacing
      "object-curly-spacing",
      // https://typescript-eslint.io/rules/padding-line-between-statements
      "padding-line-between-statements",
      // https://typescript-eslint.io/rules/semi
      "semi",
      // https://typescript-eslint.io/rules/prefer-destructuring
      "prefer-destructuring",
    ]),

    /* covered by tsc */

    ...disableRules([
      // https://typescript-eslint.io/rules/no-invalid-this
      "no-invalid-this",
      // https://typescript-eslint.io/rules/no-redeclare
      "no-redeclare",
    ]),
  },
};
