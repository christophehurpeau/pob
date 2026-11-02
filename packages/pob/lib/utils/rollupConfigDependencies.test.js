import { describe, expect, it } from "vitest";
import { getRollupConfigDependencies } from "./rollupConfigDependencies.js";

const plugin = {
  name: "alp-rollup-plugin-config",
  scripts: { build: "rollup --config rollup.config.mjs" },
};
const lib = { name: "alp-node", scripts: { build: "rollup" } };

const appConfig = `import createRollupConfig from "@pob/rollup-esbuild/createRollupConfig.js";
import config from "alp-rollup-plugin-config";
`;

describe("getRollupConfigDependencies", () => {
  it("returns workspace packages imported by a rollup config", () => {
    expect(getRollupConfigDependencies([lib, plugin], [appConfig])).toEqual([
      "alp-rollup-plugin-config",
    ]);
  });

  it("detects single quotes and subpath imports", () => {
    expect(
      getRollupConfigDependencies(
        [plugin],
        ["import config from 'alp-rollup-plugin-config/plugin.js';"],
      ),
    ).toEqual(["alp-rollup-plugin-config"]);
  });

  it("ignores packages whose name is only a prefix of the import", () => {
    expect(
      getRollupConfigDependencies(
        [{ name: "alp", scripts: { build: "rollup" } }],
        [appConfig],
      ),
    ).toEqual([]);
  });

  it("ignores packages without build script", () => {
    expect(
      getRollupConfigDependencies([{ name: plugin.name }], [appConfig]),
    ).toEqual([]);
  });

  it("returns nothing without rollup configs", () => {
    expect(getRollupConfigDependencies([plugin], [])).toEqual([]);
  });
});
