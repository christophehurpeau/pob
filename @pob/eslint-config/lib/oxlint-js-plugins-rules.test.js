import { readFileSync, readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import {
  getEnabledOxlintConfigRules,
  oxlintConfigsDir,
  reactOxlintConfigsDir,
} from "./test-utils/oxlint.js";

/**
 * Native oxlint plugin implementing rules of a JS plugin under the same names,
 * by JS plugin name. oxlint's react plugin also has the react-hooks and React
 * compiler rules.
 *
 * @type {Record<string, string>}
 */
const nativePluginNames = {
  "eslint-js": "eslint",
  "node-js": "node",
  "react-x": "react",
  "unicorn-js": "unicorn",
};

/**
 * Native oxlint rule of another plugin checking the same thing as a JS plugin
 * rule, by JS plugin rule name. Some JS plugin rules check more (noted).
 *
 * @type {Record<string, string>}
 */
const nativeRuleNamesOfOtherPlugins = {
  "node-js/no-process-exit": "unicorn/no-process-exit",
  "node-js/prefer-node-protocol": "unicorn/prefer-node-protocol",
  "regexp/prefer-named-capture-group": "eslint/prefer-named-capture-group",
  "regexp/prefer-regexp-exec": "typescript/prefer-regexp-exec",
  "regexp/prefer-regexp-test": "unicorn/prefer-regexp-test",
  "regexp/require-unicode-regexp": "eslint/require-unicode-regexp",
  "unicorn-js/id-match": "eslint/id-match",
  "unicorn-js/logical-assignment-operators":
    "eslint/logical-assignment-operators",
  "unicorn-js/no-loss-of-precision": "eslint/no-loss-of-precision",
  // also reports named usage of default exports
  "unicorn-js/no-named-default": "import/no-named-default",
  "unicorn-js/no-useless-concat": "eslint/no-useless-concat",
  "unicorn-js/operator-assignment": "eslint/operator-assignment",
  // also reports `toSorted()`, without type information
  "unicorn-js/require-array-sort-compare":
    "typescript/require-array-sort-compare",
};

const oxlintRulesInventoryPath = new URL(
  "../inventory/oxlint-rules.json",
  import.meta.url,
);

/**
 * eslint plugins run by oxlint as JS plugins (`jsPlugins` of oxlint/*.json),
 * by plugin name.
 */
const loadJsPlugins = async () => {
  /** @type {Map<string, import("eslint").ESLint.Plugin>} */
  const plugins = new Map();
  for (const dir of [oxlintConfigsDir, reactOxlintConfigsDir]) {
    for (const fileName of readdirSync(dir)) {
      if (!fileName.endsWith(".json")) continue;
      /** @type {{ jsPlugins?: { name: string; specifier: string }[] }} */
      const config = JSON.parse(readFileSync(path.join(dir, fileName), "utf8"));
      for (const { name, specifier } of config.jsPlugins ?? []) {
        if (plugins.has(name)) continue;
        const { default: plugin } = await import(
          pathToFileURL(path.resolve(dir, specifier)).href
        );
        plugins.set(name, plugin);
      }
    }
  }
  return plugins;
};

/*
 * inventory/oxlint-js-plugins-rules.json records the status of every rule of
 * the JS plugins:
 * - enabled: in oxlint/*.json, no native oxlint equivalent
 * - enabled-over-native: in oxlint/*.json, instead of the native oxlint
 *   equivalent (decision `js-plugin` in inventory/oxlint-rules.json)
 * - unset-has-native: not enabled, a native oxlint equivalent exists (its
 *   decision is in inventory/oxlint-rules.json)
 * - unset: not enabled, no native oxlint equivalent
 * - deprecated: deprecated and enabled (deprecated rules not enabled are not
 *   listed)
 * The native equivalent is the rule of the same name (nativePluginNames) or a
 * rule of another plugin (nativeRuleNamesOfOtherPlugins), named after the
 * status: `unset-has-native:eslint/no-loss-of-precision`.
 */
describe("oxlint JS plugins rules inventory", () => {
  /** @type {Record<string, string>} */
  let nativeDecisions;
  /** @type {Map<string, string>} */
  const nativeRuleNames = new Map();
  /** @type {Record<string, string>} */
  const status = {};

  beforeAll(async () => {
    nativeDecisions = JSON.parse(
      await readFile(oxlintRulesInventoryPath, "utf8"),
    );
    const enabledRules = new Set(getEnabledOxlintConfigRules());
    const plugins = await loadJsPlugins();
    for (const [pluginName, plugin] of [...plugins].toSorted(([a], [b]) =>
      a.localeCompare(b),
    )) {
      const nativePluginName = nativePluginNames[pluginName];
      for (const [ruleName, rule] of Object.entries(
        plugin.rules ?? {},
      ).toSorted(([a], [b]) => a.localeCompare(b))) {
        const fullName = `${pluginName}/${ruleName}`;
        const enabled = enabledRules.has(fullName);
        const otherPluginNativeRuleName =
          nativeRuleNamesOfOtherPlugins[fullName];
        const nativeRuleName =
          otherPluginNativeRuleName ??
          (nativePluginName && `${nativePluginName}/${ruleName}`);
        const hasNative =
          !!nativeRuleName && Object.hasOwn(nativeDecisions, nativeRuleName);
        if (hasNative) nativeRuleNames.set(fullName, nativeRuleName);
        const nativeSuffix = otherPluginNativeRuleName
          ? `:${otherPluginNativeRuleName}`
          : "";
        if (/** @type {any} */ (rule).meta?.deprecated) {
          if (enabled) status[fullName] = "deprecated";
        } else if (enabled) {
          status[fullName] = hasNative
            ? `enabled-over-native${nativeSuffix}`
            : "enabled";
        } else {
          status[fullName] = hasNative
            ? `unset-has-native${nativeSuffix}`
            : "unset";
        }
      }
    }
  });

  // New rules and newly deprecated ones of the eslint plugins run by oxlint
  // show up in the snapshot diff on upgrades.
  it("matches the snapshot", async () => {
    await expect(`${JSON.stringify(status, null, 2)}\n`).toMatchFileSnapshot(
      "../inventory/oxlint-js-plugins-rules.json",
    );
  });

  it("maps JS plugin rules to existing native rules of other plugins", () => {
    expect(
      Object.entries(nativeRuleNamesOfOtherPlugins).filter(
        ([fullName, nativeRuleName]) =>
          !Object.hasOwn(status, fullName) ||
          !Object.hasOwn(nativeDecisions, nativeRuleName),
      ),
    ).toEqual([]);
  });

  it("enables a JS plugin rule over its native rule exactly when the native decision is js-plugin", () => {
    const nativeRuleNamesOverridden = new Set(
      [...nativeRuleNames]
        .filter(
          ([fullName]) =>
            Object.hasOwn(status, fullName) &&
            (status[fullName].startsWith("enabled-over-native") ||
              status[fullName] === "deprecated"),
        )
        .map(([, nativeRuleName]) => nativeRuleName),
    );
    expect([...nativeRuleNamesOverridden].toSorted()).toEqual(
      Object.keys(nativeDecisions)
        .filter((name) => nativeDecisions[name] === "js-plugin")
        .toSorted(),
    );
  });
});
