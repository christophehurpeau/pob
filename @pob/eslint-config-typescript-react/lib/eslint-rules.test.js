import { describe, expect, it } from "vitest";
import pobConfig from "./index.js";

// plugins added by this package, the others are in @pob/eslint-config inventory
const pluginNames = new Set(["react", "react-hooks", "jsx-a11y"]);

describe("eslint rules inventory", () => {
  // New rules and newly deprecated ones of the react plugins show up in the
  // snapshot diff on upgrades. Same format as @pob/eslint-config inventory.
  it("matches the snapshot", async () => {
    const configs = Object.values(pobConfig.configs).flat();

    /** @type {Map<string, import("eslint").Rule.RuleModule>} */
    const rules = new Map();
    /** @type {Map<string, boolean>} */
    const enabledRules = new Map();
    for (const config of configs) {
      for (const [pluginName, plugin] of Object.entries(config.plugins ?? {})) {
        if (!pluginNames.has(pluginName)) continue;
        for (const [ruleName, rule] of Object.entries(plugin.rules ?? {})) {
          rules.set(
            `${pluginName}/${ruleName}`,
            /** @type {import("eslint").Rule.RuleModule} */ (rule),
          );
        }
      }
      for (const [ruleName, ruleEntry] of Object.entries(config.rules ?? {})) {
        const severity = Array.isArray(ruleEntry) ? ruleEntry[0] : ruleEntry;
        const enabled = severity !== "off" && severity !== 0;
        enabledRules.set(ruleName, enabledRules.get(ruleName) || enabled);
      }
    }

    /** @type {Record<string, "enabled" | "off" | "unset" | "deprecated">} */
    const status = {};
    for (const ruleName of [...rules.keys()].toSorted()) {
      const enabled = enabledRules.get(ruleName);
      if (rules.get(ruleName)?.meta?.deprecated) {
        if (enabled) status[ruleName] = "deprecated";
      } else if (enabled === undefined) {
        status[ruleName] = "unset";
      } else {
        status[ruleName] = enabled ? "enabled" : "off";
      }
    }

    await expect(`${JSON.stringify(status, null, 2)}\n`).toMatchFileSnapshot(
      "../inventory/eslint-rules.json",
    );
  });
});
