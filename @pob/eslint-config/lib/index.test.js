import path from "node:path";
import { describe, expect, it } from "vitest";
import { ESLint } from "eslint";
import pobConfig from "./index.js";

const rootDir = path.resolve(import.meta.dirname, "../../..");

// index.js reads the .oxlintrc.json of cwd: tests run from the root of this
// repo, whose .oxlintrc.json extends oxlint/typescript.json
describe("with oxlint/typescript.json extended", () => {
  const { configs } = pobConfig;

  const calculateConfig = (overrideConfig) =>
    new ESLint({
      cwd: rootDir,
      overrideConfigFile: true,
      overrideConfig,
    }).calculateConfigForFile(path.join(rootDir, "src/file.ts"));

  it("runs from the root of the repo", () => {
    expect(process.cwd()).toBe(rootDir);
  });

  it("does not build the TypeScript program", async () => {
    const config = await calculateConfig([
      ...configs.node,
      ...configs.monorepo,
    ]);
    expect(config.languageOptions.parserOptions).toMatchObject({
      project: false,
      projectService: false,
    });
  });

  it("enables no type-aware rule", async () => {
    const config = await calculateConfig([
      ...configs.node,
      ...configs.allowUnsafeAsWarn,
      ...configs.allowImplicitReturnType,
      ...configs.app,
      ...configs.monorepo,
    ]);
    const typeAwareRules = Object.entries(config.rules)
      .filter(([, [severity]]) => severity !== 0)
      .map(([ruleName]) => ruleName)
      .filter((ruleName) => {
        const slashIndex = ruleName.lastIndexOf("/");
        if (slashIndex === -1) return false;
        const pluginName = ruleName.slice(0, slashIndex);
        const rule =
          config.plugins[pluginName]?.rules?.[ruleName.slice(slashIndex + 1)];
        return Boolean(rule?.meta?.docs?.requiresTypeChecking);
      });
    expect(typeAwareRules).toEqual([]);
  });
});
