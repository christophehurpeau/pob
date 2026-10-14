import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import {
  getEnabledOxlintConfigRules,
  oxlintConfigsDir,
  reactOxlintConfigsDir,
} from "./test-utils/oxlint.js";

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

describe("oxlint JS plugins rules inventory", () => {
  // New rules and newly deprecated ones of the eslint plugins run by oxlint
  // show up in the snapshot diff on upgrades.
  it("matches the snapshot", async () => {
    const enabledRules = new Set(getEnabledOxlintConfigRules());
    /** @type {Record<string, "enabled" | "unset" | "deprecated">} */
    const status = {};
    const plugins = await loadJsPlugins();
    for (const [pluginName, plugin] of [...plugins].toSorted(([a], [b]) =>
      a.localeCompare(b),
    )) {
      for (const [ruleName, rule] of Object.entries(
        plugin.rules ?? {},
      ).toSorted(([a], [b]) => a.localeCompare(b))) {
        const fullName = `${pluginName}/${ruleName}`;
        const enabled = enabledRules.has(fullName);
        if (/** @type {any} */ (rule).meta?.deprecated) {
          if (enabled) status[fullName] = "deprecated";
        } else {
          status[fullName] = enabled ? "enabled" : "unset";
        }
      }
    }
    await expect(`${JSON.stringify(status, null, 2)}\n`).toMatchFileSnapshot(
      "../inventory/oxlint-js-plugins-rules.json",
    );
  });
});
