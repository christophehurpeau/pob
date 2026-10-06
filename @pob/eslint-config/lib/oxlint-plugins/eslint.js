// JS plugin of oxlint/*.json, see ./regexp.js. eslint core rules without
// oxlint equivalent, or whose oxlint version differs. Named "eslint-js":
// "eslint" is reserved for oxlint's native rules.
import { builtinRules } from "eslint/use-at-your-own-risk";

const ruleNames = [
  "camelcase",
  "dot-notation",
  "no-lone-blocks",
  "no-restricted-syntax",
  "no-undef-init",
];

export default {
  meta: { name: "eslint-js" },
  rules: Object.fromEntries(
    ruleNames.map((ruleName) => {
      const rule = builtinRules.get(ruleName);
      if (!rule) throw new Error(`Unknown eslint rule "${ruleName}"`);
      return [ruleName, rule];
    }),
  ),
};
