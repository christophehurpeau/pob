import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import type { PipelineResult } from "../engine/pipeline.ts";
import { runPipeline } from "../engine/pipeline.ts";
import { testVersions } from "../engine/testing.ts";
import { normalizeConfig } from "./config.ts";
import { steps } from "./index.ts";

let dir: string;

const author = "Test Author <test@example.com> (https://example.com)";

const writeFile = (file: string, content: string): void => {
  fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  fs.writeFileSync(path.join(dir, file), content);
};

const writeJson = (file: string, value: unknown): void => {
  writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
};

const run = (cwd: string): Promise<PipelineResult> =>
  runPipeline({
    cwd,
    steps,
    normalizeConfig,
    versions: testVersions,
    strict: true,
    check: true,
    fromPob: false,
  });

const libPkg = (name: string, extra: Record<string, unknown> = {}) => ({
  name,
  version: "1.0.0",
  description: `${name} package`,
  license: "MIT",
  author,
  type: "module",
  pob: {
    bundler: "rollup-esbuild",
    entries: ["index"],
    envs: [{ target: "node", version: "24" }],
    typescript: true,
  },
  ...extra,
});

/** writes the planned files, without running the effects */
const applyFiles = (cwd: string, result: PipelineResult): void => {
  for (const file of result.plan.files) {
    const absolutePath = path.join(cwd, file.path);
    if (file.op === "delete") {
      fs.rmSync(absolutePath, { recursive: true, force: true });
    } else {
      fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
      fs.writeFileSync(absolutePath, file.after ?? "");
    }
  }
};

const plannedContent = (
  result: PipelineResult,
  filePath: string,
): string | undefined =>
  result.plan.files.find((file) => file.path === filePath)?.after;

beforeEach(() => {
  dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "pob-mono-")));
  writeJson("package.json", {
    name: "test-monorepo",
    private: true,
    license: "MIT",
    author,
    repository: "https://github.com/test/test-monorepo.git",
    type: "module",
    workspaces: ["packages/*"],
  });
  writeJson(".yo-rc.json", {
    pob: {
      project: { type: "lib", packageManager: "pnpm", ci: false },
      renovate: { enable: false },
      monorepo: {
        ci: false,
        testing: false,
        documentation: false,
        typescript: true,
        eslint: true,
      },
    },
  });
  const libConfig = {
    pob: {
      project: { type: "lib" },
      lib: { documentation: false, testing: false, e2e: false },
    },
  };
  writeJson("packages/lib/package.json", libPkg("@scope/lib"));
  writeJson("packages/lib/.yo-rc.json", libConfig);
  writeFile("packages/lib/src/index.ts", "export const lib = 1;\n");
  writeJson(
    "packages/app/package.json",
    libPkg("@scope/app", { dependencies: { "@scope/lib": "workspace:*" } }),
  );
  writeJson("packages/app/.yo-rc.json", libConfig);
  writeFile("packages/app/src/index.ts", "export const app = 1;\n");
  // no pob config: a tsconfig only
  writeJson("packages/plain/package.json", {
    name: "plain",
    version: "1.0.0",
    description: "plain package",
    license: "MIT",
    author,
  });
  writeJson("packages/plain/tsconfig.json", {});
  writeFile("packages/plain/src/index.ts", "export const plain = 1;\n");
  // no pob config: only package.json#pob, which holds the build config
  writeJson("packages/built/package.json", libPkg("built"));
  writeJson("packages/built/tsconfig.json", {});
  writeFile("packages/built/src/index.ts", "export const built = 1;\n");
  writeFile("packages/built/rollup.config.mjs", "export default [];\n");
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("monorepo pipeline", () => {
  test("workspaces without a pob config stay in the root lists, with a warning", async () => {
    const result = await run(dir);
    expect(result.contexts.map(({ location }) => location)).toEqual([
      "packages/lib",
      "packages/app",
      ".",
    ]);
    expect(result.plan.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("packages/built"),
        expect.stringContaining("packages/plain"),
      ]),
    );
    const tsconfig = plannedContent(result, "tsconfig.json") ?? "";
    for (const location of [
      "packages/lib",
      "packages/app",
      "packages/plain",
      "packages/built",
    ]) {
      expect(tsconfig).toContain(`"path": "${location}/tsconfig.json"`);
    }
    expect(plannedContent(result, "rollup.config.mjs")).toContain(
      "./packages/built/rollup.config.mjs",
    );
    const readme = plannedContent(result, "README.md") ?? "";
    for (const name of ["@scope/lib", "@scope/app", "plain", "built"]) {
      expect(readme).toContain(`[${name}]`);
    }
  });

  test("a package run plans the tsconfig of the root run", async () => {
    applyFiles(dir, await run(dir));
    const rootRun = await run(dir);
    expect(
      rootRun.plan.files
        .map((file) => file.path)
        .filter((filePath) => filePath.endsWith("tsconfig.json")),
    ).toEqual([]);
    const appTsconfig = fs.readFileSync(
      path.join(dir, "packages/app/tsconfig.json"),
      "utf8",
    );
    expect(appTsconfig).toContain('"../../packages/lib/src"');
    const packageRun = await run(path.join(dir, "packages/app"));
    expect(plannedContent(packageRun, "tsconfig.json")).toBe(undefined);
  });
});
