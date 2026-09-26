import { builtinRules } from "eslint/use-at-your-own-risk";

/**
 * Rules of eslint core and of the plugins loaded by `configs`.
 *
 * @param {import("eslint").Linter.Config[]} configs
 */
const getLoadedRules = (configs) => {
  /** @type {Map<string, import("eslint").Rule.RuleModule>} */
  const rules = new Map(builtinRules);
  for (const config of configs) {
    for (const [pluginName, plugin] of Object.entries(config.plugins ?? {})) {
      for (const [ruleName, rule] of Object.entries(plugin.rules ?? {})) {
        rules.set(
          `${pluginName}/${ruleName}`,
          /** @type {import("eslint").Rule.RuleModule} */ (rule),
        );
      }
    }
  }
  return rules;
};

/**
 * Rules configured in `configs`: true when a config enables it, false when
 * configs only turn it off.
 *
 * @param {import("eslint").Linter.Config[]} configs
 */
const getConfiguredRules = (configs) => {
  /** @type {Map<string, boolean>} */
  const configuredRules = new Map();
  for (const config of configs) {
    for (const [ruleName, ruleEntry] of Object.entries(config.rules ?? {})) {
      const severity = Array.isArray(ruleEntry) ? ruleEntry[0] : ruleEntry;
      const enabled = severity !== "off" && severity !== 0;
      configuredRules.set(ruleName, configuredRules.get(ruleName) || enabled);
    }
  }
  return configuredRules;
};

/**
 * Status of every rule of eslint core and of the plugins loaded by `configs`:
 * `enabled` when a config enables it (for any files), `off` when configs only
 * turn it off, `unset` otherwise. Deprecated rules are listed only when
 * enabled, as `deprecated`.
 *
 * @param {import("eslint").Linter.Config[]} configs
 * @returns {Record<string, "enabled" | "off" | "unset" | "deprecated">}
 */
export const getEslintRulesStatus = (configs) => {
  const rules = getLoadedRules(configs);
  const configuredRules = getConfiguredRules(configs);

  /** @type {Record<string, "enabled" | "off" | "unset" | "deprecated">} */
  const status = {};
  for (const ruleName of [...rules.keys()].toSorted()) {
    const enabled = configuredRules.get(ruleName);
    if (rules.get(ruleName)?.meta?.deprecated) {
      if (enabled) status[ruleName] = "deprecated";
    } else if (enabled === undefined) {
      status[ruleName] = "unset";
    } else {
      status[ruleName] = enabled ? "enabled" : "off";
    }
  }
  return status;
};
