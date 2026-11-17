import { describe, expect, test } from "vitest";
import { createPkgModel } from "./pkg.ts";
import { defineStep } from "./step.ts";
import { WriteConflictError, createTracker } from "./tracker.ts";

const versions = (dependency: string): string | undefined =>
  ({ eslint: "10.0.0", vitest: "^5.0.0", react: "19.0.0" })[dependency];

const step = (name: string, writes: string[], reads: string[] = []) =>
  defineStep<unknown>({ name, writes, reads, run: () => {} });

describe("dependencies", () => {
  test("adds with the pob-dependencies version, cleaned for devDependencies", () => {
    const pkg = createPkgModel(
      { name: "a" },
      createTracker({ strict: false }),
      versions,
    );
    pkg.addDevDependencies(["vitest", "eslint"]);
    expect(pkg.render()).toEqual({
      name: "a",
      devDependencies: { eslint: "10.0.0", vitest: "5.0.0" },
    });
  });

  test("never downgrades and keeps workspace ranges", () => {
    const pkg = createPkgModel(
      { devDependencies: { eslint: "11.0.0", vitest: "workspace:*" } },
      createTracker({ strict: false }),
      versions,
    );
    pkg.addDevDependencies(["eslint", "vitest"]);
    expect(pkg.render().devDependencies).toEqual({
      eslint: "11.0.0",
      vitest: "workspace:*",
    });
  });

  test("a devDependency already in dependencies is removed", () => {
    const pkg = createPkgModel(
      {
        dependencies: { react: "19.0.0" },
        devDependencies: { react: "18.0.0" },
      },
      createTracker({ strict: false }),
      versions,
    );
    pkg.addDevDependencies(["react"]);
    expect(pkg.render()).toEqual({ dependencies: { react: "19.0.0" } });
  });

  test("keeps a devDependency listed in peerDependencies", () => {
    const pkg = createPkgModel(
      {
        peerDependencies: { react: "*" },
        devDependencies: { react: "19.0.0" },
      },
      createTracker({ strict: false }),
      versions,
    );
    pkg.removeDevDependencies(["react"]);
    expect(pkg.render().devDependencies).toEqual({ react: "19.0.0" });
  });

  test("throws for a dependency unknown to pob-dependencies", () => {
    const pkg = createPkgModel({}, createTracker({ strict: false }), versions);
    expect(() => {
      pkg.addDevDependencies(["unknown"]);
    }).toThrow("Missing pobDependency: unknown");
  });
});

describe("script chains", () => {
  test("joins the commands of several steps in declared order", () => {
    const tracker = createTracker({ strict: true });
    const pkg = createPkgModel({}, tracker, versions);
    tracker.runAs(step("typescript", ["pkg.scripts.build"]), () => {
      pkg.chain("build").add("definitions", "pnpm run build:definitions", {
        after: ["rollup"],
      });
    });
    tracker.runAs(step("transpiler", ["pkg.scripts.build"]), () => {
      pkg.chain("build").add("rollup", "rollup --config rollup.config.mjs");
    });
    expect(pkg.render().scripts).toEqual({
      build: "rollup --config rollup.config.mjs && pnpm run build:definitions",
    });
  });

  test("is idempotent: the existing value is replaced, not appended to", () => {
    const tracker = createTracker({ strict: false });
    const pkg = createPkgModel(
      { scripts: { build: "rollup && pnpm run build:definitions" } },
      tracker,
      versions,
    );
    pkg.chain("build").add("rollup", "rollup");
    pkg.chain("build").add("definitions", "pnpm run build:definitions", {
      after: ["rollup"],
    });
    expect(pkg.render().scripts).toEqual({
      build: "rollup && pnpm run build:definitions",
    });
  });

  test("setting a chained script by hand conflicts", () => {
    const tracker = createTracker({ strict: true });
    const pkg = createPkgModel({}, tracker, versions);
    tracker.runAs(step("transpiler", ["pkg.scripts.build"]), () => {
      pkg.chain("build").add("rollup", "rollup");
    });
    tracker.runAs(step("monorepo", ["pkg.scripts.build"]), () => {
      expect(() => {
        pkg.set("scripts.build", "tsc");
      }).toThrow(WriteConflictError);
    });
  });
});
