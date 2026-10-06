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
  // JS plugins: the eslint plugins themselves, loaded by oxlint
  ["regexp", "regexp/"],
  ["@pob", "@pob/"],
  // named "<plugin>-js" when the name is reserved for a native plugin
  ["eslint-js", ""],
  ["unicorn-js", "unicorn/"],
  ["node-js", "n/"],
  ["react-js", "react/"],
]);

/** oxlint plugins without eslint equivalent in @pob/eslint-config */
const oxlintOnlyPlugins = new Set(["oxc", "promise", "vitest"]);

/** oxlint implements eslint-plugin-react-hooks rules in its react plugin */
const reactHooksRules = new Set(["rules-of-hooks", "exhaustive-deps"]);

const typescriptEslintRules =
  /** @type {import("eslint").ESLint.Plugin} */ (tseslint.plugin).rules ?? {};

/**
 * eslint core rule → typescript-eslint rules extending it. Type-aware ones are
 * not listed: oxlint's core rule does not replace them (see T1 in
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

/**
 * Rules of an oxlint config, including its overrides.
 *
 * @param {{ rules?: Record<string, unknown>; overrides?: { rules?: Record<string, unknown> }[] }} config
 * @returns {string[]}
 */
export const getOxlintConfigRuleNames = (config) => [
  ...Object.keys(config.rules ?? {}),
  ...(config.overrides ?? []).flatMap((override) =>
    Object.keys(override.rules ?? {}),
  ),
];

const unusedDisableDirectiveRegExp =
  /^Unused eslint-disable directive \(no problems were reported from (.+)\)\.$/;

/**
 * Rules named by eslint's "Unused eslint-disable directive" report, undefined
 * for other messages.
 *
 * @param {import("eslint").Linter.LintMessage} message
 * @returns {string[] | undefined}
 */
export const getUnusedDisableDirectiveRuleNames = (message) => {
  if (message.ruleId !== null) return undefined;
  const match = unusedDisableDirectiveRegExp.exec(message.message);
  if (!match) return undefined;
  return [...match[1].matchAll(/'([^']+)'/g)].map(([, ruleName]) => ruleName);
};

/**
 * Drops eslint's "Unused eslint-disable directive" reports for rules checked
 * by oxlint, so projects keep their `eslint-disable` comments of moved rules:
 * oxlint honors them, and `eslint --fix` no longer deletes them. Unused
 * directives of other rules are still reported and fixed.
 *
 * @param {Set<string>} oxlintEslintRuleNames eslint names of the rules checked
 *   by oxlint
 * @returns {import("eslint").Linter.Processor}
 */
export const createOxlintDisableDirectivesProcessor = (
  oxlintEslintRuleNames,
) => ({
  meta: { name: "@pob/eslint-config/oxlint-disable-directives" },
  supportsAutofix: true,
  preprocess: (text) => [text],
  postprocess: (messageLists) =>
    messageLists.flat().filter((message) => {
      const ruleNames = getUnusedDisableDirectiveRuleNames(message);
      return !ruleNames?.every((ruleName) =>
        oxlintEslintRuleNames.has(ruleName),
      );
    }),
});
