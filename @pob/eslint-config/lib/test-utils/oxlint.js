import { execFile } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const oxlintPackageJsonUrl = import.meta.resolve("oxlint/package.json");
const { default: oxlintPkg } = await import(oxlintPackageJsonUrl, {
  with: { type: "json" },
});
const oxlintBinPath = fileURLToPath(
  new URL(
    typeof oxlintPkg.bin === "string" ? oxlintPkg.bin : oxlintPkg.bin.oxlint,
    oxlintPackageJsonUrl,
  ),
);

export const oxlintConfigsDir = fileURLToPath(
  new URL("../../oxlint/", import.meta.url),
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
 * `plugin/rule` name of a diagnostic, from its code like `jsx-a11y(alt-text)`.
 * Undefined for diagnostics not reported by a rule (unused directives).
 *
 * @param {OxlintDiagnostic} diagnostic
 */
export const getDiagnosticRuleName = (diagnostic) => {
  const match = diagnostic.code && /^([^(]+)\(([^)]+)\)$/.exec(diagnostic.code);
  return match ? `${match[1].replaceAll("-", "_")}/${match[2]}` : undefined;
};

/**
 * @param {unknown} ruleEntry
 */
const isRuleEnabled = (ruleEntry) => {
  const severity = Array.isArray(ruleEntry) ? ruleEntry[0] : ruleEntry;
  return severity !== "off" && severity !== "allow" && severity !== 0;
};

/**
 * Rules enabled in `oxlint/*.json` (including `overrides`), as `plugin/rule`.
 *
 * @returns {string[]}
 */
export const getEnabledOxlintConfigRules = () => {
  const ruleNames = new Set();
  for (const fileName of readdirSync(oxlintConfigsDir)) {
    if (!fileName.endsWith(".json")) continue;
    /** @type {{ rules?: Record<string, unknown>; overrides?: { rules?: Record<string, unknown> }[] }} */
    const config = JSON.parse(
      readFileSync(path.join(oxlintConfigsDir, fileName), "utf8"),
    );
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
