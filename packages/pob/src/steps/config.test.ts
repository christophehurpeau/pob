import { describe, expect, test } from "vitest";
import type { PobConfig } from "../engine/config.ts";
import { createTestContext } from "../engine/testing.ts";
import { buildPobJson } from "./config.ts";

const json = (value: unknown): string => JSON.stringify(value, null, 2);

const rootConfig: PobConfig = {
  project: { type: "lib", packageManager: "yarn", ci: true },
  monorepo: { typescript: true },
};

const pkgPob = {
  bundler: "rollup-esbuild",
  entries: ["index"],
  envs: [{ target: "node", version: "20" }],
};

const yoRc = {
  pob: {
    project: { type: "lib" },
    lib: { documentation: true, testing: false },
  },
};

const createPackage = (files: Record<string, string>) =>
  createTestContext({
    location: "packages/a",
    files: { "src/index.ts": "export {};\n", ...files },
    facts: {
      isRoot: false,
      inMonorepo: {
        rootDir: "/test",
        relative: "packages/a",
        rootPkg: { name: "root", workspaces: ["packages/*"] },
        rootConfig,
      },
    },
    rootConfig,
  });

/** pob.json as pob writes it from the legacy sources */
const writtenPobJson = (): PobConfig => {
  const { $schema: _, ...pobJson } = buildPobJson(
    createPackage({
      "package.json": json({ name: "a", pob: pkgPob }),
      ".yo-rc.json": json(yoRc),
    }),
  );
  return pobJson;
};

describe("legacy sources next to pob.json", () => {
  test("pob.json holds the normalized legacy values", () => {
    const pobJson = writtenPobJson();
    expect(pobJson.build?.envs).not.toEqual(pkgPob.envs);
    expect(pobJson.lib?.documentation).toBe(false);
    expect(() =>
      createPackage({
        "package.json": json({ name: "a", pob: pkgPob }),
        ".yo-rc.json": json(yoRc),
        "pob.json": json(pobJson),
      }),
    ).not.toThrow();
  });

  test("a legacy value pob.json does not have fails", () => {
    expect(() =>
      createPackage({
        "package.json": json({
          name: "a",
          pob: { ...pkgPob, bundler: "tsc" },
        }),
        "pob.json": json(writtenPobJson()),
      }),
    ).toThrow(
      "pob.json and legacy config files disagree, nothing was changed. Move the values to keep into pob.json, then remove them from the legacy file:\n  - package.json#pob: build.bundler",
    );
  });
});

test("pob.json keeps the gitignore paths", () => {
  const pobJson = buildPobJson(
    createPackage({
      "package.json": json({ name: "a" }),
      "pob.json": json({
        project: { type: "lib" },
        lib: {},
        gitignore: ["/snapshots/"],
      }),
    }),
  );
  expect(pobJson.gitignore).toEqual(["/snapshots/"]);
});
