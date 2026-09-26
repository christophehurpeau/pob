import tseslint from "typescript-eslint";

/** oxlint plugin name → eslint rule name prefix */
const eslintRulePrefixes = new Map([
  ["eslint", ""],
  ["typescript", "@typescript-eslint/"],
  ["unicorn", "unicorn/"],
  ["import", "import-x/"],
  ["node", "n/"],
  ["react", "react/"],
  ["jsx_a11y", "jsx-a11y/"],
]);

/** oxlint plugins without eslint equivalent in @pob/eslint-config */
const oxlintOnlyPlugins = new Set(["oxc", "promise", "vitest"]);

/** oxlint implements eslint-plugin-react-hooks rules in its react plugin */
const reactHooksRules = new Set(["rules-of-hooks", "exhaustive-deps"]);

const typescriptEslintRules =
  /** @type {import("eslint").ESLint.Plugin} */ (tseslint.plugin).rules ?? {};

/**
 * eslint core rule → typescript-eslint rules extending it. Type-aware ones are
 * not listed: oxlint's core rule does not replace them (see TA1 in
 * docs/oxlint-migration.md).
 *
 * @type {Map<string, string[]>}
 */
const typescriptExtensionRules = new Map();
for (const [ruleName, rule] of Object.entries(typescriptEslintRules)) {
  const docs =
    /** @type {{ extendsBaseRule?: boolean | string; requiresTypeChecking?: boolean } | undefined} */ (
      rule.meta?.docs
    );
  if (!docs?.extendsBaseRule || docs.requiresTypeChecking) continue;
  const baseRuleName =
    docs.extendsBaseRule === true ? ruleName : docs.extendsBaseRule;
  typescriptExtensionRules.set(baseRuleName, [
    ...(typescriptExtensionRules.get(baseRuleName) ?? []),
    `@typescript-eslint/${ruleName}`,
  ]);
}

/**
 * Returns the eslint rule names checked by an oxlint rule, to turn them off in
 * eslint. Rules of plugins other than eslint core must be prefixed with their
 * oxlint plugin name (`typescript/`, `unicorn/`, ...).
 *
 * @param {string} oxlintRuleName
 * @returns {string[]}
 */
export const oxlintToEslintRuleNames = (oxlintRuleName) => {
  const slashIndex = oxlintRuleName.indexOf("/");
  const pluginName =
    slashIndex === -1 ? "eslint" : oxlintRuleName.slice(0, slashIndex);
  const ruleName = oxlintRuleName.slice(slashIndex + 1);

  if (oxlintOnlyPlugins.has(pluginName)) return [];
  if (pluginName === "eslint") {
    return [ruleName, ...(typescriptExtensionRules.get(ruleName) ?? [])];
  }
  if (pluginName === "react" && reactHooksRules.has(ruleName)) {
    return [`react-hooks/${ruleName}`];
  }
  const prefix = eslintRulePrefixes.get(pluginName);
  if (prefix === undefined) {
    throw new Error(
      `Unknown oxlint plugin "${pluginName}" in rule "${oxlintRuleName}"`,
    );
  }
  return [`${prefix}${ruleName}`];
};
