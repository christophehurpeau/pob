import path from "node:path";
import { describe, expect, it } from "vitest";
import { ESLint } from "eslint";
import pobConfig from "./index.js";

const rootDir = path.resolve(import.meta.dirname, "../../..");

/**
 * Rules eslint enables for `filePath`: every other rule runs in oxlint, a rule
 * listed here must not be in oxlint/*.json.
 *
 * @param {import("eslint").Linter.Config[]} configs
 * @param {string} filePath
 */
const getEnabledRules = async (configs, filePath) => {
  const config = await new ESLint({
    cwd: rootDir,
    overrideConfigFile: true,
    overrideConfig: configs,
  }).calculateConfigForFile(path.join(rootDir, filePath));
  return Object.entries(config.rules)
    .filter(([, [severity]]) => severity !== 0)
    .map(([ruleName]) => ruleName)
    .toSorted();
};

const importRules = [
  "import-x/export",
  "import-x/no-extraneous-dependencies",
  "import-x/no-import-module-exports",
  "import-x/no-relative-packages",
  "import-x/no-unresolved",
  "import-x/no-useless-path-segments",
  "import-x/order",
];

// tests run from the root of this repo, an ES module package
describe("configs.node", () => {
  const { configs } = pobConfig;

  it("runs from the root of the repo", () => {
    expect(process.cwd()).toBe(rootDir);
  });

  it.each([
    ["src/file.js", [...importRules, "n/hashbang", "no-undef", "unicode-bom"]],
    [
      "src/file.cjs",
      [...importRules, "n/hashbang", "no-undef", "strict", "unicode-bom"],
    ],
    ["src/file.ts", [...importRules, "n/hashbang", "unicode-bom"]],
    ["src/file.tsx", [...importRules, "n/hashbang", "unicode-bom"]],
    ["scripts/file.js", [...importRules, "no-undef", "unicode-bom"]],
  ])(
    "enables only the rules oxlint cannot check in %s",
    async (filePath, expected) => {
      expect(await getEnabledRules(configs.node, filePath)).toEqual(
        expected.toSorted(),
      );
    },
  );

  it("parses TypeScript files without the TypeScript program", async () => {
    const config = await new ESLint({
      cwd: rootDir,
      overrideConfigFile: true,
      overrideConfig: configs.node,
    }).calculateConfigForFile(path.join(rootDir, "src/file.ts"));
    expect(config.languageOptions.parser.meta.name).toBe(
      "typescript-eslint/parser",
    );
    expect(config.languageOptions.parserOptions.project).toBeUndefined();
  });
});

describe("configs.baseModule", () => {
  const { configs } = pobConfig;

  it.each([
    ["src/file.js", [...importRules, "no-undef", "unicode-bom"]],
    ["src/file.cjs", [...importRules, "no-undef", "strict", "unicode-bom"]],
    ["src/file.ts", [...importRules, "unicode-bom"]],
    ["scripts/file.js", [...importRules, "no-undef", "unicode-bom"]],
  ])(
    "enables only the rules oxlint cannot check in %s",
    async (filePath, expected) => {
      expect(await getEnabledRules(configs.baseModule, filePath)).toEqual(
        expected.toSorted(),
      );
    },
  );
});
