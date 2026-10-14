import { describe, expect, it } from "vitest";
import { getEslintRulesStatus } from "./test-utils/eslintRules.js";
import pobConfig from "./index.js";

describe("eslint rules inventory", () => {
  // New rules and newly deprecated ones of eslint and its plugins show up in
  // the snapshot diff on upgrades.
  it("matches the snapshot", async () => {
    const configs = Object.values(pobConfig.configs).flat();
    await expect(
      `${JSON.stringify(getEslintRulesStatus(configs), null, 2)}\n`,
    ).toMatchFileSnapshot("../inventory/eslint-rules.json");
  });
});
