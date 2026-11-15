import { describe, expect, test } from "vitest";
import type { PackageContext } from "../../engine/context.ts";
import { defineStep } from "../../engine/step.ts";
import {
  createTestContext,
  plannedContent,
  runTestSteps,
} from "../../engine/testing.ts";
import { appExpoStep, appStep, appViteStep } from "./app.ts";
import { libSideEffectsStep, libStep } from "./lib.ts";
import {
  inMonorepoFacts,
  json,
  plannedOp,
  plannedPkg,
  yoRc,
} from "./testUtils.ts";

const transpilerStub = defineStep<PackageContext>({
  name: "transpiler",
  writes: ["pkg.sideEffects"],
  run: (ctx) => {
    if (!ctx.pkg.has("sideEffects")) ctx.pkg.set("sideEffects", true);
  },
});

const appFiles = (
  app: Record<string, unknown>,
  pkg: Record<string, unknown> = {},
): Record<string, string> => ({
  "package.json": json({ name: "app", private: true, ...pkg }),
  ".yo-rc.json": yoRc({
    project: { type: "app", packageManager: "pnpm", ci: true },
    app,
  }),
});

describe("lib", () => {
  test("sideEffects forced to false after the transpiler", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: {
          "package.json": json({ name: "lib", pob: { typescript: true } }),
          ".yo-rc.json": yoRc({
            project: { type: "lib", packageManager: "yarn", ci: true },
            lib: {},
          }),
        },
      }),
      [libSideEffectsStep, transpilerStub],
    );
    expect(plannedPkg(plan).sideEffects).toBe(false);
  });

  test("sideEffects true with an executable env: importing it runs it", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: {
          "package.json": json({
            name: "cli",
            sideEffects: false,
            pob: {
              bundler: "rollup-esbuild",
              entries: ["index"],
              envs: [{ target: "node", version: "24", executable: true }],
              typescript: true,
            },
          }),
          ".yo-rc.json": yoRc({
            project: { type: "lib", packageManager: "yarn", ci: true },
            lib: {},
          }),
        },
      }),
      [libSideEffectsStep, transpilerStub],
    );
    expect(plannedPkg(plan).sideEffects).toBe(true);
  });

  test("monorepo package: release scripts and build outputs removed", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: {
          "package.json": json({
            name: "lib",
            scripts: { preversion: "a", release: "b", version: "c", test: "d" },
          }),
          ".yo-rc.json": yoRc({
            project: { type: "lib" },
            lib: { documentation: true },
          }),
          "coverage/lcov.info": "",
          "generated-docs/index.html": "",
          "dist/index.js": "",
        },
        facts: inMonorepoFacts(),
      }),
      [libStep],
    );
    expect(plannedPkg(plan).scripts).toEqual({ test: "d" });
    expect(plannedOp(plan, "coverage")).toBe("delete");
    // documentation is disabled in the packages of a monorepo
    expect(plannedOp(plan, "generated-docs")).toBeUndefined();
    expect(plannedOp(plan, "dist")).toBe("delete");
  });

  test("pob-dependencies keeps its preversion script", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: {
          "package.json": json({
            name: "pob-dependencies",
            scripts: { preversion: "a", version: "c" },
          }),
          ".yo-rc.json": yoRc({ project: { type: "lib" }, lib: {} }),
        },
        facts: inMonorepoFacts(),
      }),
      [libStep],
    );
    expect(plannedPkg(plan).scripts).toEqual({ preversion: "a" });
  });
});

describe("app", () => {
  test("vite app: hash slash import, expo keys removed, seeded files", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: appFiles(
          { type: "vite" },
          {
            name: "<app>",
            expo: { a: 1 },
            scripts: { "upgrade-expo": "x" },
          },
        ),
      }),
      [appStep, appViteStep],
    );
    const pkg = plannedPkg(plan);
    expect(pkg.imports).toEqual({ "#/*": "./src/*" });
    expect(pkg.expo).toBeUndefined();
    expect(pkg.scripts).toEqual({
      "build:analyze": "ENABLE_ANALYZER=true vite build",
      build: "vite build",
      start: "vite",
      serve: "vite preview",
    });
    expect(pkg.devDependencies).toEqual({ vite: "4.0.0" });
    expect(plannedContent(plan, "src/index.ts")).toBe(
      'document.body.append("&lt;app&gt;");\n',
    );
    expect(plannedContent(plan, "vite.config.js")).toContain('root: "src"');
  });

  test("vite app with an existing vite config: nothing seeded", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: { ...appFiles({ type: "vite" }), "vite.config.ts": "" },
      }),
      [appViteStep],
    );
    expect(plannedOp(plan, "vite.config.js")).toBeUndefined();
    expect(plannedOp(plan, "src/index.html")).toBeUndefined();
  });

  test("vite app with server: scripts", async () => {
    const plan = await runTestSteps(
      createTestContext({ files: appFiles({ type: "vite-with-server" }) }),
      [appViteStep],
    );
    expect(plannedPkg(plan).scripts).toEqual({
      build: "pnpm run build:client && pnpm run build:server",
      "build:client": "vite build --outDir dist/client",
      "build:server":
        "vite build --ssr src/entry-server.tsx --outDir dist/server",
      preview: "pnpm run build && pnpm run start:prod",
      start: "node server.js",
      "start:prod": "NODE_ENV=production node server.js",
    });
    expect(plannedOp(plan, "vite.config.js")).toBeUndefined();
  });

  test("expo app", async () => {
    const plan = await runTestSteps(
      createTestContext({ files: appFiles({ type: "expo" }) }),
      [appStep, appExpoStep],
    );
    const pkg = plannedPkg(plan);
    expect(pkg.main).toBe("./src/AppEntry.tsx");
    expect(pkg.expo).toEqual({ install: { exclude: ["typescript"] } });
    expect(pkg.scripts).toEqual({
      "upgrade-expo": "expo install expo@57 --fix",
    });
  });

  test("untranspiled library: main and exports from the existing entry", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: {
          ...appFiles(
            { type: "untranspiled-library" },
            {
              imports: { "#/*": "./src/*" },
              exports: { "./x": "./src/x.js" },
            },
          ),
          "src/index.tsx": "",
        },
      }),
      [appStep],
    );
    const pkg = plannedPkg(plan);
    expect(pkg.imports).toBeUndefined();
    expect(pkg.main).toBe("./src/index.tsx");
    expect(pkg.exports).toEqual({
      ".": "./src/index.tsx",
      "./x": "./src/x.js",
    });
  });

  test("node app with a committed build: dist is kept", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: {
          ...appFiles(
            { type: "node", distribute: true, buildInGit: true },
            { imports: { "#/*": "./src/*", "#x": "./x.js" } },
          ),
          "dist/index.js": "",
          "coverage/lcov.info": "",
        },
      }),
      [appStep],
    );
    expect(plannedPkg(plan).imports).toEqual({ "#x": "./x.js" });
    expect(plannedOp(plan, "dist")).toBeUndefined();
    expect(plannedOp(plan, "coverage")).toBe("delete");
  });
});
