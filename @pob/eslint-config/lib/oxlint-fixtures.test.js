import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ESLint } from "eslint";
import {
  getDiagnosticRuleName,
  getEnabledOxlintConfigRules,
  lintWithOxlint,
  oxlintConfigsDir,
  toCanonicalOxlintRuleName,
} from "./test-utils/oxlint.js";
import { oxlintToEslintRuleNames } from "./utils/oxlint.js";
import pobConfig from "./index.js";

const packageDir = path.resolve(import.meta.dirname, "..");
const rootDir = path.resolve(packageDir, "../..");
const testLintDir = path.join(packageDir, "test-lint");

/**
 * Rules named by the oxlint-disable directives of `source`, as `plugin/rule`.
 *
 * @param {string} source
 */
const getDirectiveRules = (source) =>
  [...source.matchAll(/oxlint-disable(?:-next-line|-line)?([^\n]*)/g)].flatMap(
    ([, rest]) =>
      rest
        .split("*/")[0]
        .split("--")[0]
        .split(",")
        .map((rule) => rule.trim())
        .filter(Boolean)
        .map((rule) => toCanonicalOxlintRuleName(rule)),
  );

/**
 * Removes eslint and oxlint directives, keeping line numbers.
 *
 * @param {string} source
 */
const stripDirectives = (source) =>
  source
    .replaceAll(
      /\/\*\s*(?:eslint|oxlint)-(?:disable|enable)[\s\S]*?\*\//g,
      (comment) => comment.replaceAll(/[^\n]/g, ""),
    )
    .replaceAll(/\/\/\s*(?:eslint|oxlint)-(?:disable|enable)[^\n]*/g, "");

/**
 * @param {number[]} lines
 */
const sortLines = (lines) => lines.toSorted((a, b) => a - b);

const enabledOxlintRules = getEnabledOxlintConfigRules();

const testLintDirents = await readdir(testLintDir, {
  recursive: true,
  withFileTypes: true,
});

/** @type {{ relativePath: string; source: string; oxlintRules: Set<string> }[]} */
const fixtures = await Promise.all(
  testLintDirents
    .filter((dirent) => dirent.isFile())
    .map(async (dirent) => {
      const filePath = path.join(dirent.parentPath, dirent.name);
      const source = await readFile(filePath, "utf8");
      return {
        relativePath: path.relative(packageDir, filePath),
        source,
        oxlintRules: new Set(getDirectiveRules(source)),
      };
    }),
);

/**
 * @param {string} oxlintRule
 */
const getRuleFixtures = (oxlintRule) =>
  fixtures.filter((fixture) => fixture.oxlintRules.has(oxlintRule));

describe("oxlint rules fixtures", () => {
  // with P1 directive options, `pnpm lint:oxlint` fails if the rule stops
  // reporting on the fixture
  it.each(enabledOxlintRules)(
    "%s has a test-lint fixture with an oxlint-disable directive",
    (oxlintRule) => {
      expect(getRuleFixtures(oxlintRule)).not.toEqual([]);
    },
  );
});

describe("oxlint and eslint parity", () => {
  /** @type {string} */
  let oxlintCwd;
  /** @type {Map<string, { rule: string | undefined; line: number }[]>} */
  const oxlintResults = new Map();
  const eslint = new ESLint({
    cwd: rootDir,
    overrideConfigFile: true,
    overrideConfig: pobConfig.configs.node.filter(
      (config) => config.name !== "@pob/eslint-config/oxlint",
    ),
  });

  beforeAll(async () => {
    oxlintCwd = await mkdtemp(path.join(tmpdir(), "pob-oxlint-parity-"));
    await writeFile(
      path.join(oxlintCwd, ".oxlintrc.json"),
      JSON.stringify({ extends: [path.join(oxlintConfigsDir, "base.json")] }),
    );
    for (const fixture of fixtures) {
      if (fixture.oxlintRules.size === 0) continue;
      const filePath = path.join(oxlintCwd, fixture.relativePath);
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, stripDirectives(fixture.source));
    }
    for (const diagnostic of await lintWithOxlint(oxlintCwd)) {
      const results = oxlintResults.get(diagnostic.filename) ?? [];
      results.push({
        rule: getDiagnosticRuleName(diagnostic),
        line: diagnostic.labels[0].span.line,
      });
      oxlintResults.set(diagnostic.filename, results);
    }
  });

  afterAll(async () => {
    if (oxlintCwd) await rm(oxlintCwd, { recursive: true, force: true });
  });

  it.each(
    enabledOxlintRules.flatMap((oxlintRule) =>
      getRuleFixtures(oxlintRule).map((fixture) => ({ oxlintRule, fixture })),
    ),
  )(
    "$oxlintRule reports the same lines as eslint in $fixture.relativePath",
    async ({ oxlintRule, fixture }) => {
      const eslintRuleNames = new Set(oxlintToEslintRuleNames(oxlintRule));
      const [eslintResult] = await eslint.lintText(
        stripDirectives(fixture.source),
        { filePath: path.join(packageDir, fixture.relativePath) },
      );
      const eslintLines = sortLines(
        eslintResult.messages
          .filter(({ ruleId }) => ruleId && eslintRuleNames.has(ruleId))
          .map(({ line }) => line),
      );
      const oxlintLines = sortLines(
        (oxlintResults.get(fixture.relativePath) ?? [])
          .filter(({ rule }) => rule === oxlintRule)
          .map(({ line }) => line),
      );

      expect(eslintLines).not.toEqual([]);
      expect(oxlintLines).toEqual(eslintLines);
    },
  );
});
