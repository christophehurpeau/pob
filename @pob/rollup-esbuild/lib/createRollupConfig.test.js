import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import createRollupConfig from "./createRollupConfig.js";

describe("createRollupConfig", () => {
  let cwd;

  beforeEach(() => {
    cwd = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), "pob-rollup-esbuild-")),
    );
    fs.mkdirSync(path.join(cwd, "src"));
    fs.writeFileSync(path.join(cwd, "src/index.ts"), "export {};");
  });

  afterEach(() => {
    fs.rmSync(cwd, { recursive: true, force: true });
  });

  const writeJson = (file, value) => {
    fs.writeFileSync(path.join(cwd, file), JSON.stringify(value));
  };

  const build = {
    entries: ["index"],
    envs: [{ target: "node", version: "24" }],
  };

  it("reads pob.json#build", () => {
    writeJson("package.json", { name: "a", type: "module" });
    writeJson("pob.json", { build });
    expect(createRollupConfig({ cwd })).toHaveLength(1);
  });

  it("falls back to package.json#pob when pob.json has no build", () => {
    writeJson("package.json", { name: "a", type: "module", pob: build });
    writeJson("pob.json", { project: { type: "lib" } });
    const configs = createRollupConfig({ cwd });
    expect(configs).toHaveLength(1);
    expect(configs[0].input).toBe(path.join(cwd, "src/index.ts"));
  });
});
