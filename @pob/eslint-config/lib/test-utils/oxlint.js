import { execFile } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

// the bin used by projects, which also locates tsgolint for type-aware rules
const oxlintBinPath = fileURLToPath(
  new URL("./bin/oxlint.js", import.meta.resolve("@pob/root/package.json")),
);

export const oxlintConfigsDir = fileURLToPath(
  new URL("../../oxlint/", import.meta.url),
);

// @pob/eslint-config-typescript-react shares the inventory of this package
export const reactOxlintConfigsDir = fileURLToPath(
  new URL("../../../eslint-config-typescript-react/oxlint/", import.meta.url),
);

/**
 * Runs oxlint in `cwd` and parses its JSON output.
 *
 * @param {string} cwd
 * @param {string[]} args
 * @returns {Promise<any>}
 */
const execOxlint = async (cwd, args) => {
  try {
    const { stdout } = await execFileAsync(
      process.execPath,
      [oxlintBinPath, ...args],
      { cwd, maxBuffer: 16 * 1024 * 1024 },
    );
    return JSON.parse(stdout);
  } catch (error) {
    const { code, stdout } = /** @type {{ code: unknown; stdout: string }} */ (
      error
    );
    // oxlint exits with code 1 when it reports errors
    if (code !== 1) throw error;
    return JSON.parse(stdout);
  }
};

/**
 * @typedef {{
 *   code?: string;
 *   message: string;
 *   severity: string;
 *   filename: string;
 *   labels: { span: { line: number } }[];
 * }} OxlintDiagnostic
 */

/**
 * Lints `cwd` with the .oxlintrc.json it contains.
 *
 * @param {string} cwd
 * @returns {Promise<OxlintDiagnostic[]>}
 */
export const lintWithOxlint = async (cwd) => {
  const { diagnostics } = await execOxlint(cwd, ["-f", "json"]);
  return diagnostics;
};

/**
 * Rules implemented by the installed oxlint, as `plugin/rule`.
 *
 * @param {string} cwd
 * @returns {Promise<{ name: string; typeAware: boolean }[]>}
 */
export const listOxlintRules = async (cwd) => {
  /** @type {{ scope: string; value: string; type_aware: boolean }[]} */
  const rules = await execOxlint(cwd, ["--rules", "-f", "json"]);
  return rules.map(({ scope, value, type_aware: typeAware }) => ({
    name: `${scope}/${value}`,
    typeAware,
  }));
};

/**
 * `plugin/rule` name, as listed by `oxlint --rules`. Core rules can be written
 * without the `eslint/` prefix in configs and directives.
 *
 * @param {string} ruleName
 */
export const toCanonicalOxlintRuleName = (ruleName) =>
  ruleName.includes("/") ? ruleName : `eslint/${ruleName}`;

/**
 * @param {unknown} ruleEntry
 */
const isRuleEnabled = (ruleEntry) => {
  const severity = Array.isArray(ruleEntry) ? ruleEntry[0] : ruleEntry;
  return severity !== "off" && severity !== "allow" && severity !== 0;
};

/**
 * Rules enabled in `oxlint/*.json` of this package and of
 * @pob/eslint-config-typescript-react (including `overrides`), as
 * `plugin/rule`.
 *
 * @returns {string[]}
 */
export const getEnabledOxlintConfigRules = () => {
  const ruleNames = new Set();
  const configPaths = [oxlintConfigsDir, reactOxlintConfigsDir].flatMap((dir) =>
    readdirSync(dir)
      .filter((fileName) => fileName.endsWith(".json"))
      .map((fileName) => path.join(dir, fileName)),
  );
  for (const configPath of configPaths) {
    /** @type {{ rules?: Record<string, unknown>; overrides?: { rules?: Record<string, unknown> }[] }} */
    const config = JSON.parse(readFileSync(configPath, "utf8"));
    for (const rules of [
      config.rules,
      ...(config.overrides ?? []).map((override) => override.rules),
    ]) {
      for (const [ruleName, ruleEntry] of Object.entries(rules ?? {})) {
        if (isRuleEnabled(ruleEntry)) {
          ruleNames.add(toCanonicalOxlintRuleName(ruleName));
        }
      }
    }
  }
  return [...ruleNames].toSorted();
};
