import { describe, expect, it } from "vitest";
import { Linter } from "eslint";
import { builtinRules } from "eslint/use-at-your-own-risk";
import importPlugin from "eslint-plugin-import-x";
import nodePlugin from "eslint-plugin-n";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import tseslint from "typescript-eslint";
import oxlintConfig from "../../oxlint/base.json" with { type: "json" };
import {
  createOxlintDisableDirectivesProcessor,
  getUnusedDisableDirectiveRuleNames,
  oxlintToEslintRuleNames,
} from "./oxlint.js";

/** @type {import("eslint").Linter.Config} */
const baseConfig = {
  linterOptions: { reportUnusedDisableDirectives: "error" },
  rules: { "no-debugger": "off", "no-unreachable": "error" },
};

describe("getUnusedDisableDirectiveRuleNames", () => {
  // fails if an eslint upgrade rewords the message the processor relies on
  it.each([
    ["no-debugger", ["no-debugger"]],
    ["no-debugger, no-console", ["no-debugger", "no-console"]],
    [
      "no-debugger, no-console, no-alert",
      ["no-debugger", "no-console", "no-alert"],
    ],
  ])(
    "parses eslint's report for eslint-disable-next-line %s",
    (ruleNames, expected) => {
      const messages = new Linter().verify(
        `// eslint-disable-next-line ${ruleNames}\nexport const a = 1;\n`,
        baseConfig,
      );
      expect(messages).toHaveLength(1);
      expect(getUnusedDisableDirectiveRuleNames(messages[0])).toEqual(expected);
    },
  );

  it("ignores other messages", () => {
    const messages = new Linter().verify(
      "export function f() {\n  return;\n  f();\n}\n",
      baseConfig,
    );
    expect(messages.map(({ ruleId }) => ruleId)).toEqual(["no-unreachable"]);
    expect(getUnusedDisableDirectiveRuleNames(messages[0])).toBeUndefined();
  });
});

describe("createOxlintDisableDirectivesProcessor", () => {
  /** @type {import("eslint").Linter.Config[]} */
  const configs = [
    baseConfig,
    {
      files: ["**/*.js"],
      processor: createOxlintDisableDirectivesProcessor(
        new Set(["no-debugger"]),
      ),
    },
  ];
  const source = [
    "// eslint-disable-next-line no-debugger",
    "export const a = 1;",
    "// eslint-disable-next-line no-unreachable",
    "export const b = 1;",
    "",
  ].join("\n");

  it("drops unused directive reports of rules checked by oxlint only", () => {
    const messages = new Linter().verify(source, configs, "file.js");
    expect(
      messages.map((message) => getUnusedDisableDirectiveRuleNames(message)),
    ).toEqual([["no-unreachable"]]);
  });

  it("keeps the comments of rules checked by oxlint on --fix", () => {
    const { output } = new Linter().verifyAndFix(source, configs, "file.js");
    // eslint's fix leaves the indentation of the removed comment
    expect(output.split("\n").map((line) => line.trim())).toEqual([
      "// eslint-disable-next-line no-debugger",
      "export const a = 1;",
      "",
      "export const b = 1;",
      "",
    ]);
  });
});

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
