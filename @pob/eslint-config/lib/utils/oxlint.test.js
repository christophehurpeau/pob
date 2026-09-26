import { describe, expect, it } from "vitest";
import { builtinRules } from "eslint/use-at-your-own-risk";
import importPlugin from "eslint-plugin-import-x";
import nodePlugin from "eslint-plugin-n";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import tseslint from "typescript-eslint";
import oxlintConfig from "../../oxlint/base.json" with { type: "json" };
import { oxlintToEslintRuleNames } from "./oxlint.js";

describe("oxlintToEslintRuleNames", () => {
  it.each([
    ["no-debugger", ["no-debugger"]],
    ["eslint/no-debugger", ["no-debugger"]],
    ["typescript/no-explicit-any", ["@typescript-eslint/no-explicit-any"]],
    ["unicorn/prefer-node-protocol", ["unicorn/prefer-node-protocol"]],
    ["import/no-cycle", ["import-x/no-cycle"]],
    ["node/no-path-concat", ["n/no-path-concat"]],
    ["jsx_a11y/alt-text", ["jsx-a11y/alt-text"]],
    ["react/jsx-key", ["react/jsx-key"]],
    ["react/rules-of-hooks", ["react-hooks/rules-of-hooks"]],
    ["react/exhaustive-deps", ["react-hooks/exhaustive-deps"]],
    ["oxc/no-map-spread", []],
    ["promise/valid-params", []],
    ["vitest/no-focused-tests", []],
  ])("maps %s", (oxlintRuleName, eslintRuleNames) => {
    expect(oxlintToEslintRuleNames(oxlintRuleName)).toEqual(eslintRuleNames);
  });

  it.each([
    ["no-unused-vars", ["no-unused-vars", "@typescript-eslint/no-unused-vars"]],
    [
      "eslint/no-redeclare",
      ["no-redeclare", "@typescript-eslint/no-redeclare"],
    ],
    [
      "no-useless-constructor",
      ["no-useless-constructor", "@typescript-eslint/no-useless-constructor"],
    ],
  ])(
    "maps extension rule %s to the core and typescript-eslint rules",
    (oxlintRuleName, eslintRuleNames) => {
      expect(oxlintToEslintRuleNames(oxlintRuleName)).toEqual(eslintRuleNames);
    },
  );

  it.each([
    ["require-await"],
    ["dot-notation"],
    ["no-implied-eval"],
    ["no-throw-literal"],
  ])("keeps type-aware extension rules of %s in eslint", (oxlintRuleName) => {
    expect(oxlintToEslintRuleNames(oxlintRuleName)).toEqual([oxlintRuleName]);
  });

  it("throws on unknown plugins", () => {
    expect(() => oxlintToEslintRuleNames("jsdoc/check-tag-names")).toThrow(
      'Unknown oxlint plugin "jsdoc" in rule "jsdoc/check-tag-names"',
    );
  });
});

describe("oxlint/base.json", () => {
  /** @type {[string, unknown][]} */
  const plugins = [
    ["@typescript-eslint/", tseslint.plugin],
    ["unicorn/", eslintPluginUnicorn],
    ["import-x/", importPlugin],
    ["n/", nodePlugin],
  ];
  const eslintRuleNames = new Set([
    ...builtinRules.keys(),
    ...plugins.flatMap(([prefix, plugin]) =>
      Object.keys(
        /** @type {import("eslint").ESLint.Plugin} */ (plugin).rules ?? {},
      ).map((ruleName) => `${prefix}${ruleName}`),
    ),
  ]);

  it.each(Object.keys(oxlintConfig.rules))(
    "%s turns off existing eslint rules",
    (oxlintRuleName) => {
      const mapped = oxlintToEslintRuleNames(oxlintRuleName);
      expect(mapped.length).toBeGreaterThan(0);
      expect(mapped.filter((name) => !eslintRuleNames.has(name))).toEqual([]);
    },
  );
});
