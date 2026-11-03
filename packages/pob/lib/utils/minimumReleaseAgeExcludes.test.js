import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  minimumReleaseAgeExcludeNames,
  minimumReleaseAgeExcludePatterns,
} from "./minimumReleaseAgeExcludes.js";

const rootPath = fileURLToPath(new URL("../../../../", import.meta.url));

const readPublishedPackageNames = (directory) =>
  fs
    .readdirSync(path.join(rootPath, directory), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(rootPath, directory, entry.name, "package.json"))
    .filter((packageJsonPath) => fs.existsSync(packageJsonPath))
    .map((packageJsonPath) => JSON.parse(fs.readFileSync(packageJsonPath)))
    .filter((pkg) => !pkg.private)
    .map((pkg) => pkg.name);

describe("minimumReleaseAgeExcludes", () => {
  it("lists every published @pob package by name for bun", () => {
    for (const name of readPublishedPackageNames("@pob")) {
      expect(minimumReleaseAgeExcludeNames).toContain(name);
    }
  });

  it("excludes the same packages with globs and with exact names", () => {
    expect(
      minimumReleaseAgeExcludeNames.filter((name) => !name.startsWith("@pob/")),
    ).toStrictEqual(
      minimumReleaseAgeExcludePatterns.filter((name) => name !== "@pob/*"),
    );
  });

  it("uses no glob in exact names", () => {
    for (const name of minimumReleaseAgeExcludeNames) {
      expect(name).not.toContain("*");
    }
  });
});
