import { describe, expect, test } from "vitest";
import { resolveConfig } from "./config.ts";

describe("resolveConfig", () => {
  test("merges .yo-rc.json and package.json#pob", () => {
    expect(
      resolveConfig(
        {
          yoRc: {
            project: { type: "lib", packageManager: "pnpm", ci: true },
            lib: { testing: { runner: "vitest" } },
          },
          pkgPob: { bundler: "rollup-esbuild", typescript: true },
        },
        { isRoot: true },
      ),
    ).toEqual({
      source: "legacy",
      missing: [],
      config: {
        project: { type: "lib", packageManager: "pnpm", ci: true },
        lib: { testing: { runner: "vitest" } },
        build: { bundler: "rollup-esbuild", typescript: true },
      },
    });
  });

  test("pob.json wins over legacy sources holding the same values", () => {
    const { config, source } = resolveConfig(
      {
        pobJson: {
          project: { type: "app" },
          app: { type: "vite" },
          lib: { testing: false },
          build: { bundler: "tsc" },
        },
        yoRc: {
          project: { type: "app" },
          promptValues: { author: "a" },
        },
        pkgPob: { bundler: "tsc" },
        legacyPobJson: {},
      },
      { isRoot: false },
    );
    expect(source).toBe("pob.json");
    expect(config).toEqual({
      project: { type: "app" },
      app: { type: "vite" },
      lib: { testing: false },
      build: { bundler: "tsc" },
    });
  });

  test("fails when a legacy source differs from pob.json", () => {
    expect(() =>
      resolveConfig(
        {
          pobJson: {
            project: { type: "app" },
            app: { type: "vite" },
            build: { bundler: "tsc" },
          },
          yoRc: {
            project: { type: "lib" },
            app: { type: "vite", testing: true },
          },
          pkgPob: { bundler: "rollup-esbuild" },
          legacyPobJson: { testing: true },
        },
        { isRoot: false },
      ),
    ).toThrow(
      [
        "pob.json and legacy config files disagree, nothing was changed. Move the values to keep into pob.json, then remove them from the legacy file:",
        "  - .yo-rc.json (pob key): project.type, app.testing",
        "  - package.json#pob: build.bundler",
        "  - .pob.json: lib.testing.codecov",
      ].join("\n"),
    );
  });

  test("yarn2 becomes yarnNodeLinker", () => {
    expect(
      resolveConfig(
        {
          yoRc: {
            project: {
              type: "lib",
              packageManager: "yarn",
              yarn2: true,
              ci: false,
            },
          },
        },
        { isRoot: true },
      ).config.project,
    ).toEqual({
      type: "lib",
      packageManager: "yarn",
      yarnNodeLinker: "node-modules",
      ci: false,
    });
  });

  test(".pob.json of old versions becomes the lib config", () => {
    expect(
      resolveConfig(
        {
          yoRc: { project: { type: "lib" } },
          legacyPobJson: {
            testing: { runner: "node", travisci: true, ci: true },
            documentation: { url: "x" },
            flow: false,
            envs: ["node10", "module"],
            entries: ["index"],
          },
        },
        { isRoot: false },
      ).config,
    ).toEqual({
      project: { type: "lib" },
      lib: { testing: { runner: "node" }, documentation: true },
      build: {
        bundler: "rollup-babel",
        envs: [
          { target: "node", version: 14, formats: ["cjs"] },
          { target: "browser", formats: ["es"] },
        ],
        entries: ["index"],
        jsx: undefined,
      },
    });
  });

  test("testing: true of old lib configs", () => {
    expect(
      resolveConfig(
        { yoRc: { project: { type: "lib" }, lib: { testing: true } } },
        { isRoot: false },
      ).config.lib,
    ).toEqual({ testing: { codecov: true } });
  });

  test("babelEnvs move to envs with the rollup-babel bundler", () => {
    expect(
      resolveConfig(
        {
          yoRc: { project: { type: "lib" } },
          pkgPob: { babelEnvs: [{ target: "node", version: "14" }] },
        },
        { isRoot: false },
      ).config.build,
    ).toEqual({
      bundler: "rollup-babel",
      envs: [{ target: "node", version: "14" }],
    });
  });

  test("drops the derived packageNames of monorepos", () => {
    expect(
      resolveConfig(
        {
          yoRc: {
            project: { type: "lib", packageManager: "yarn", ci: true },
            monorepo: { typescript: true, packageNames: ["a"] },
          },
        },
        { isRoot: true },
      ).config.monorepo,
    ).toEqual({ typescript: true });
  });

  test("lists the keys missing at the root", () => {
    expect(
      resolveConfig({ yoRc: { project: { type: "lib" } } }, { isRoot: true })
        .missing,
    ).toEqual(["project.packageManager", "project.ci"]);
  });
});
