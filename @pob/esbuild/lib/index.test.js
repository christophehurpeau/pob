import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createEsbuildOptions } from "./index.js";

describe("createEsbuildOptions", () => {
  let cwd;

  beforeEach(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), "pob-esbuild-"));
  });

  afterEach(() => {
    fs.rmSync(cwd, { recursive: true, force: true });
  });

  const writeJson = (file, value) => {
    fs.writeFileSync(path.join(cwd, file), JSON.stringify(value));
  };

  it("reads the entries of pob.json#build", () => {
    writeJson("package.json", { name: "a", pob: { entries: ["legacy"] } });
    writeJson("pob.json", { build: { entries: ["index"] } });
    expect(createEsbuildOptions({ cwd }).entryPoints).toEqual(["src/index"]);
  });

  it("falls back to package.json#pob when pob.json has no build", () => {
    writeJson("package.json", { name: "a", pob: { entries: ["index"] } });
    writeJson("pob.json", { project: { type: "app" } });
    expect(createEsbuildOptions({ cwd }).entryPoints).toEqual(["src/index"]);
  });

  it("reads package.json#pob without pob.json", () => {
    writeJson("package.json", { name: "a", pob: { entries: ["index"] } });
    expect(createEsbuildOptions({ cwd }).entryPoints).toEqual(["src/index"]);
  });
});
