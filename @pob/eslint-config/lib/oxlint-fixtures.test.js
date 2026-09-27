import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  getEnabledOxlintConfigRules,
  toCanonicalOxlintRuleName,
} from "./test-utils/oxlint.js";

const testLintDir = path.resolve(import.meta.dirname, "../test-lint");

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

const testLintDirents = await readdir(testLintDir, {
  recursive: true,
  withFileTypes: true,
});

const fixturesDirectiveRules = await Promise.all(
  testLintDirents
    .filter((dirent) => dirent.isFile())
    .map(async (dirent) =>
      getDirectiveRules(
        await readFile(path.join(dirent.parentPath, dirent.name), "utf8"),
      ),
    ),
);
const directiveRules = new Set(fixturesDirectiveRules.flat());

describe("oxlint rules fixtures", () => {
  // with P1 directive options, `pnpm lint:oxlint` fails if the rule stops
  // reporting on the fixture
  it.each(getEnabledOxlintConfigRules())(
    "%s has a test-lint fixture with an oxlint-disable directive",
    (oxlintRule) => {
      expect(directiveRules.has(oxlintRule)).toBe(true);
    },
  );
});
