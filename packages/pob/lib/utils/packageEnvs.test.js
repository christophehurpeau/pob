import { describe, expect, it } from "vitest";
import { getEntryEnvs, getPackageEnvs } from "./packageEnvs.js";

const node24 = { target: "node", version: "24", omitVersionInFileName: true };
const browser = { target: "browser" };

describe("getEntryEnvs", () => {
  it("uses the envs of the entry", () => {
    expect(getEntryEnvs({ name: "git", envs: [node24] }, [browser])).toEqual([
      node24,
    ]);
  });

  it("falls back to the envs of the package", () => {
    expect(getEntryEnvs("index", [browser])).toEqual([browser]);
    expect(getEntryEnvs({ name: "index" }, [browser])).toEqual([browser]);
  });

  it("falls back to node", () => {
    expect(getEntryEnvs("index", undefined)).toEqual([
      { target: "node", version: "22" },
    ]);
  });
});

describe("getPackageEnvs", () => {
  it("returns the envs of the package", () => {
    expect(getPackageEnvs({ envs: [node24], entries: ["index"] })).toEqual([
      node24,
    ]);
  });

  it("returns the union of the envs of the entries", () => {
    expect(
      getPackageEnvs({
        entries: [
          { name: "index", envs: [node24, browser] },
          { name: "git", envs: [node24] },
        ],
      }),
    ).toEqual([node24, browser]);
  });

  it("returns undefined when no env is declared", () => {
    expect(getPackageEnvs({ entries: ["index"] })).toBeUndefined();
    expect(getPackageEnvs(undefined)).toBeUndefined();
  });
});
