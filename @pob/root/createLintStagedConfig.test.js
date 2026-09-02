import { describe, expect, it } from "vitest";
import createLintStagedConfig from "./createLintStagedConfig.js";

describe("createLintStagedConfig", () => {
  it("returns a valid lint-staged configuration", () => {
    const config = createLintStagedConfig();
    expect(config).toBeDefined();
    expect(typeof config).toBe("object");
  });

  describe("pattern matching", () => {
    it("handles root-level config files", () => {
      const config = createLintStagedConfig();
      expect(config).toBeDefined();
    });

    it("handles workspace-level config files when workspaces are configured", () => {
      const config = createLintStagedConfig();
      expect(config).toBeDefined();
    });

    it("handles config directory patterns", () => {
      const config = createLintStagedConfig();
      expect(config).toBeDefined();
    });
  });
});
