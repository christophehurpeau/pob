import { describe, expect, test } from "vitest";
import type { PackageContext } from "../../engine/context.ts";
import { defineStep } from "../../engine/step.ts";
import type { TestContextOptions } from "../../engine/testing.ts";
import {
  createTestContext,
  plannedContent,
  runTestSteps,
} from "../../engine/testing.ts";
import { babelStep } from "./babel.ts";
import { babelLegacyPart, transpilerLegacyPart } from "./legacy.ts";
import { buildChainIds, transpilerStep } from "./transpiler.ts";

const json = (value: unknown): string => JSON.stringify(value, null, 2);

const libYoRc = json({
  pob: {
    project: { type: "lib", packageManager: "yarn", ci: false },
    lib: { testing: false },
  },
});

const appYoRc = (type: string): string =>
  json({
    pob: {
      project: { type: "app", packageManager: "pnpm", ci: false },
      app: { type },
    },
  });

const parse = (content: string | undefined): Record<string, unknown> =>
  JSON.parse(content ?? "{}") as Record<string, unknown>;

const legacyTestStep = defineStep<PackageContext>({
  name: "legacy",
  writes: [...babelLegacyPart.writes, ...transpilerLegacyPart.writes],
  run: (ctx) => {
    babelLegacyPart.run(ctx);
    transpilerLegacyPart.run(ctx);
  },
});

const run = async (
  files: Record<string, string>,
  options: Partial<TestContextOptions> = {},
): Promise<{
  plan: Awaited<ReturnType<typeof runTestSteps>>;
  pkg: Record<string, unknown>;
  warnings: string[];
}> => {
  const ctx = createTestContext({ files, ...options });
  const warnings: string[] = [];
  ctx.warn = (message) => {
    warnings.push(message);
  };
  const plan = await runTestSteps(ctx, [
    legacyTestStep,
    babelStep,
    transpilerStep,
  ]);
  return { plan, pkg: parse(plannedContent(plan, "package.json")), warnings };
};

describe("babel", () => {
  test("refuses babel envs", async () => {
    await expect(
      run({
        ".yo-rc.json": libYoRc,
        "package.json": json({
          name: "lib",
          pob: { babelEnvs: [{ target: "node", version: "14" }] },
        }),
      }),
    ).rejects.toThrow(
      'step "babel" failed: pob-babel is deprecated. Use @pob/rollup-esbuild or @pob/rollup-typescript instead.',
    );
  });

  test("refuses pob-babel in dependencies", async () => {
    await expect(
      run({
        ".yo-rc.json": libYoRc,
        "package.json": json({
          name: "lib",
          dependencies: { "pob-babel": "1.0.0" },
          pob: {},
        }),
      }),
    ).rejects.toThrow("pob-babel is deprecated.");
  });

  test("requires the build config of a node app", async () => {
    await expect(
      run({ ".yo-rc.json": appYoRc("node"), "package.json": json({}) }),
    ).rejects.toThrow("Missing pob config: build");
  });
});

describe("transpiler", () => {
  test("untranspiled lib with hand-written definitions", async () => {
    const { pkg, plan } = await run({
      ".yo-rc.json": libYoRc,
      "package.json": json({
        name: "lib",
        type: "module",
        scripts: { build: "old", start: "node ." },
        pob: {},
      }),
      "lib/index.js": "",
      "lib/index.d.ts": "",
      "rollup.config.mjs": "",
    });
    expect(pkg.scripts).toEqual({
      build: "yarn run build:definitions",
      "build:definitions":
        "tsrs --lib esnext --noEmit --skipLibCheck ./lib/index.d.ts",
    });
    expect(pkg.main).toBe("./lib/index.js");
    expect(pkg.types).toBe("./lib/index.d.ts");
    expect(pkg.exports).toEqual({
      ".": { types: "./lib/index.d.ts", default: "./lib/index.js" },
      "./package.json": "./package.json",
    });
    expect(pkg.sideEffects).toBe(true);
    expect(
      plan.files.find((file) => file.path === "rollup.config.mjs"),
    ).toEqual(expect.objectContaining({ op: "delete" }));
    expect(plan.effects).toEqual([]);
  });

  test("typescript check-only lib only builds the definitions", async () => {
    const { pkg } = await run({
      ".yo-rc.json": libYoRc,
      "package.json": json({
        name: "lib",
        exports: "./lib/index.js",
        pob: { typescript: "check-only" },
      }),
    });
    expect(pkg.scripts).toEqual({
      build: "yarn run build:definitions",
      "build:definitions": "tsrs -p tsconfig.json",
    });
  });

  test("build chain: other steps run after the definitions", async () => {
    const ctx = createTestContext({
      files: {
        ".yo-rc.json": libYoRc,
        "package.json": json({
          name: "lib",
          pob: {
            bundler: "rollup-esbuild",
            entries: ["index"],
            envs: [{ target: "node", version: "24" }],
          },
        }),
      },
    });
    const otherStep = defineStep<PackageContext>({
      name: "other",
      writes: ["pkg.scripts.build"],
      after: ["transpiler"],
      run: ({ pkg }) => {
        pkg.chain("build").add("other", "echo done", {
          after: [buildChainIds.definitions],
        });
      },
    });
    const plan = await runTestSteps(ctx, [
      babelStep,
      transpilerStep,
      otherStep,
    ]);
    const pkg = parse(plannedContent(plan, "package.json"));
    expect((pkg.scripts as Record<string, string>).build).toBe(
      "yarn run clean:build && rollup --config rollup.config.mjs && yarn run build:definitions && echo done",
    );
  });

  test("lib: envs, exports and browserslist", async () => {
    const { pkg, plan } = await run({
      ".yo-rc.json": libYoRc,
      "package.json": json({
        name: "lib",
        typings: "./old.d.ts",
        browserslist: { modern: ["x"], development: ["last 1 chrome version"] },
        pob: {
          bundler: "rollup-esbuild",
          entries: [
            "index",
            { name: "cli", envs: [{ target: "node", version: "24" }] },
          ],
          extraEntries: ["src/style.css", { name: "bin", types: "bin.d.ts" }],
          envs: [
            { target: "node", version: "20", formats: ["es", "cjs"] },
            { target: "node", version: "24" },
            { target: "browser", formats: ["es"] },
            { target: "browser", version: "modern" },
          ],
        },
      }),
    });
    expect(pkg.typings).toBeUndefined();
    expect(pkg.types).toBe("./dist/definitions/index.d.ts");
    expect(pkg.main).toBe("./dist/index-node22.mjs");
    expect(pkg.module).toBe("./dist/index-browser.es.js");
    expect(pkg.browser).toBe("./dist/index-browser.es.js");
    expect(pkg.exports).toEqual({
      "./package.json": "./package.json",
      ".": {
        types: "./dist/definitions/index.d.ts",
        node: {
          import: "./dist/index-node22.mjs",
          "node:24": { import: "./dist/index-node24.mjs" },
        },
        browser: {
          "browser:modern": { import: "./dist/index-browsermodern.es.js" },
          import: "./dist/index-browser.es.js",
        },
      },
      "./cli": {
        types: "./dist/definitions/cli.d.ts",
        node: { import: "./dist/cli-node24.mjs" },
      },
      "./style.css": {
        style: "./src/style.css",
        import: "./src/style.css",
        default: "./src/style.css",
      },
      "./bin": {
        types: "./bin.d.ts",
        import: "./bin.mjs",
        require: "./bin.js",
      },
    });
    expect(pkg.browserslist).toEqual({
      development: ["last 1 chrome version"],
      production: [
        "defaults",
        "> 0.2%",
        "not ie < 12",
        "not safari < 10",
        "not ios_saf < 10",
      ],
    });
    // the install step plans the build, after the install
    expect(plan.effects).toEqual([]);
  });

  test("tsc lib: no clean script, tslib", async () => {
    const { pkg, plan } = await run({
      ".yo-rc.json": libYoRc,
      "package.json": json({
        name: "lib",
        type: "module",
        dependencies: {},
        pob: {
          bundler: "tsc",
          typescript: true,
          entries: ["index"],
          envs: [{ target: "node", version: "24" }],
        },
      }),
    });
    expect(pkg.scripts).toEqual({ build: "tsrs" });
    expect(pkg.dependencies).toEqual({ tslib: "^5.0.0" });
    expect(pkg.exports).toEqual({
      "./package.json": "./package.json",
      ".": {
        types: "./dist/definitions/index.d.ts",
        node: { import: "./dist/index.js" },
      },
    });
    expect(plan.effects).toEqual([]);
  });

  test("monorepo package: no build effect", async () => {
    const { plan } = await run(
      {
        ".yo-rc.json": json({ pob: { project: { type: "lib" }, lib: {} } }),
        "package.json": json({
          name: "lib",
          pob: { bundler: "tsc", typescript: true, entries: ["index"] },
        }),
      },
      {
        location: "packages/lib",
        facts: {
          isRoot: false,
          inMonorepo: {
            rootDir: "/test",
            relative: "packages/lib",
            rootPkg: {},
            rootConfig: { project: { type: "lib", packageManager: "yarn" } },
          },
        },
        rootConfig: { project: { type: "lib", packageManager: "yarn" } },
      },
    );
    expect(plan.effects).toEqual([]);
  });

  test("alp-node app", async () => {
    const { pkg, plan } = await run({
      ".yo-rc.json": appYoRc("alp-node"),
      "package.json": json({
        name: "app",
        sideEffects: false,
        types: "./x.d.ts",
        scripts: { watch: "x" },
        pob: {
          bundler: "rollup-esbuild",
          entries: ["index"],
          envs: [{ target: "node", version: "24" }],
        },
      }),
    });
    expect(pkg.scripts).toEqual({
      build: "pnpm run clean:build && rollup --config rollup.config.mjs",
      clean: "pnpm run clean:build",
      "clean:build": "pob-esbuild-clean-out build",
      start:
        "pnpm run clean:build && rollup --config rollup.config.mjs --watch",
    });
    expect(pkg.sideEffects).toBeUndefined();
    expect(pkg.types).toBeUndefined();
    expect(pkg.main).toBe("./build/index-node24.mjs");
    expect(pkg.devDependencies).toEqual({
      "@pob/rollup-esbuild": "19.0.0",
      "alp-rollup-plugin-config": "24.0.0",
    });
    expect(plannedContent(plan, "rollup.config.mjs")).toBe(
      `// Generated by pob: do not edit, it is overwritten on each pob run.
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import createRollupConfig from "@pob/rollup-esbuild/createRollupConfig.js";
import run from "@pob/rollup-esbuild/plugin-run.cjs";
import config from "alp-rollup-plugin-config";

const watch = process.env.ROLLUP_WATCH === "true";

export default createRollupConfig({
  cwd: dirname(fileURLToPath(import.meta.url)),
  outDirectory: "build",
  plugins: [
    config({
      targets: [{ src: "src/config/**/*.yml" }],
    }),
    watch && run({ execArgv: ["--enable-source-maps"] }),
  ],
});
`,
    );
  });

  test("node-library app: sideEffects set with a warning", async () => {
    const { pkg, plan, warnings } = await run({
      ".yo-rc.json": appYoRc("node-library"),
      "package.json": json({
        name: "app",
        pob: {
          bundler: "rollup-typescript",
          entries: ["index"],
          envs: [{ target: "node", version: "24" }],
        },
      }),
    });
    expect(pkg.sideEffects).toBe(true);
    expect(pkg.types).toBe("./src/index.ts");
    expect(warnings).toEqual([
      "Setting pkg.sideEffects to true, as it was not defined",
    ]);
    expect(plannedContent(plan, "rollup.config.mjs")).toContain("plugins: [],");
  });
});

describe("legacy parts", () => {
  test("remove old build keys, babel files and root entry files", async () => {
    const { pkg, plan, warnings } = await run({
      ".yo-rc.json": libYoRc,
      "package.json": json({
        name: "lib",
        "module:node": "./x.js",
        "webpack:browser": "./y.js",
        "browser-dev": "./z.js",
        scripts: { postbuild: "x", "watch:dev": "y" },
        devDependencies: {
          "pob-babel": "1.0.0",
          "@babel/core": "1.0.0",
          "@babel/preset-env": "1.0.0",
        },
        dependencies: { "@babel/runtime": "1.0.0" },
        pob: {
          bundler: "rollup-esbuild",
          entries: ["index", "cli"],
          envs: [{ target: "node", version: "24" }],
        },
      }),
      "index.js": "",
      "cli.js": "",
      ".babelrc": "{}",
    });
    expect(Object.keys(pkg)).not.toContain("module:node");
    expect(Object.keys(pkg)).not.toContain("webpack:browser");
    expect(Object.keys(pkg)).not.toContain("browser-dev");
    expect(pkg.devDependencies).toEqual({ "@pob/rollup-esbuild": "19.0.0" });
    expect(pkg.dependencies).toBeUndefined();
    expect(
      plan.files
        .filter((file) => file.op === "delete")
        .map((file) => file.path)
        .toSorted(),
    ).toEqual([".babelrc", "index.js"]);
    expect(warnings).toEqual([
      "cli.js: generated by an old pob version, delete it",
    ]);
  });
});
