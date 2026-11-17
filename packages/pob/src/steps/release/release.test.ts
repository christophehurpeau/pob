import { describe, expect, test } from "vitest";
import type { PackageContext } from "../../engine/context.ts";
import { defineStep } from "../../engine/step.ts";
import {
  createTestContext,
  plannedContent,
  runTestSteps,
} from "../../engine/testing.ts";
import type { LegacyPart } from "../legacy/part.ts";
import { huskyStep } from "./husky.ts";
import {
  huskyLegacyPart,
  oldDependenciesLegacyPart,
  releaseLegacyPart,
} from "./legacy.ts";
import { releaseStep } from "./release.ts";

const githubExpression = (expression: string): string =>
  `\${{ ${expression} }}`;

const json = (value: unknown): string => JSON.stringify(value);
const yoRc = (pob: unknown): string => json({ pob });

const parse = (content: string | undefined): Record<string, unknown> =>
  JSON.parse(content ?? "{}") as Record<string, unknown>;

const legacyStepOf = (part: LegacyPart) =>
  defineStep<PackageContext>({
    name: "legacy",
    writes: part.writes,
    run: part.run,
  });

const operations = (plan: Awaited<ReturnType<typeof runTestSteps>>) =>
  plan.files.map(({ path, op }) => `${op} ${path}`);

const libYoRc = (project: Record<string, unknown>) =>
  yoRc({
    project: { type: "lib", packageManager: "yarn", ci: true, ...project },
    lib: { testing: { runner: "vitest" } },
  });

const monorepoPackageFacts = {
  isRoot: false,
  inMonorepo: {
    rootDir: "/test",
    relative: "packages/a",
    rootPkg: {},
    rootConfig: {
      project: { type: "lib" as const, packageManager: "yarn" as const },
    },
  },
};

describe("husky", () => {
  test("commonjs root: lint-staged config as .mjs, .cjs removed", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: {
          "package.json": json({
            name: "lib",
            devDependencies: { husky: "4.0.0" },
          }),
          ".yo-rc.json": libYoRc({}),
          "lint-staged.config.cjs": "module.exports = {};\n",
        },
      }),
      [legacyStepOf(huskyLegacyPart), huskyStep],
    );
    expect(operations(plan).toSorted()).toEqual([
      "create lint-staged.config.mjs",
      "delete lint-staged.config.cjs",
      "modify package.json",
    ]);
    const pkg = parse(plannedContent(plan, "package.json"));
    expect(pkg.devDependencies).toEqual({ "@pob/root": "9.0.0" });
    expect(pkg.commitlint).toEqual({
      extends: ["@pob/root/commitlint-config"],
    });
  });

  test("pob-monorepo keeps its lint-staged config", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: {
          "package.json": json({ name: "pob-monorepo", type: "module" }),
          ".yo-rc.json": libYoRc({}),
          "lint-staged.config.cjs": "module.exports = {};\n",
        },
      }),
      [legacyStepOf(huskyLegacyPart), huskyStep],
    );
    expect(plannedContent(plan, "lint-staged.config.js")).toBe(
      "module.exports = {};\n",
    );
    const pkg = parse(plannedContent(plan, "package.json"));
    expect(pkg.devDependencies).toBeUndefined();
    expect(pkg.commitlint).toEqual({
      extends: ["@pob/root/commitlint-config"],
    });
  });

  test("lib in a monorepo: no commitlint, no @pob/root, no stray config", async () => {
    const plan = await runTestSteps(
      createTestContext({
        location: "packages/a",
        files: {
          "package.json": json({
            name: "a",
            commitlint: { extends: [] },
            devDependencies: {
              "@pob/root": "1.0.0",
              "@pob/commitlint-config": "1.0.0",
            },
          }),
          ".yo-rc.json": yoRc({ project: { type: "lib" }, lib: {} }),
          "lint-staged.config.cjs": "module.exports = {};\n",
        },
        facts: monorepoPackageFacts,
      }),
      [legacyStepOf(huskyLegacyPart), huskyStep],
    );
    expect(operations(plan).toSorted()).toEqual([
      "delete packages/a/lint-staged.config.cjs",
      "modify packages/a/package.json",
    ]);
    const pkg = parse(plannedContent(plan, "packages/a/package.json"));
    expect(pkg.commitlint).toBeUndefined();
    expect(pkg.devDependencies).toBeUndefined();
  });

  test("app in a monorepo: not composed", async () => {
    const plan = await runTestSteps(
      createTestContext({
        location: "packages/a",
        files: {
          "package.json": json({
            name: "a",
            commitlint: { extends: [] },
            devDependencies: { husky: "4.0.0" },
          }),
          ".yo-rc.json": yoRc({
            project: { type: "app" },
            app: { type: "node" },
          }),
          ".huskyrc.js": "",
        },
        facts: monorepoPackageFacts,
      }),
      [legacyStepOf(huskyLegacyPart), huskyStep],
    );
    expect(operations(plan)).toEqual(["modify packages/a/package.json"]);
    expect(parse(plannedContent(plan, "packages/a/package.json"))).toEqual({
      name: "a",
      commitlint: { extends: [] },
      devDependencies: { husky: "4.0.0" },
    });
  });
});

describe("release", () => {
  test("without ci: preversion script, no workflow", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: {
          "package.json": json({
            name: "lib",
            pob: { bundler: "tsc", typescript: true },
          }),
          ".yo-rc.json": libYoRc({ ci: false }),
          ".github/workflows/release.yml": "name: Release\n",
        },
      }),
      [releaseStep],
    );
    expect(operations(plan).toSorted()).toEqual([
      "delete .github/workflows/release.yml",
      "modify package.json",
    ]);
    expect(parse(plannedContent(plan, "package.json")).scripts).toEqual({
      preversion: "yarn run lint && yarn run build && repository-check-dirty",
    });
  });

  test("disabled: removes preversion, except in pob-dependencies", async () => {
    const files = (name: string) => ({
      "package.json": json({ name, scripts: { preversion: "echo" } }),
      ".yo-rc.json": yoRc({
        project: { type: "lib", packageManager: "npm", ci: true },
        lib: { testing: false },
      }),
    });
    const removed = await runTestSteps(
      createTestContext({ files: files("lib") }),
      [releaseStep],
    );
    expect(
      parse(plannedContent(removed, "package.json")).scripts,
    ).toBeUndefined();
    const kept = await runTestSteps(
      createTestContext({ files: files("pob-dependencies") }),
      [releaseStep],
    );
    expect(parse(plannedContent(kept, "package.json")).scripts).toEqual({
      preversion: "echo",
    });
  });

  test("independent bun monorepo: bump dependents, publish with pob-version", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: {
          "package.json": json({ name: "root", private: true }),
          ".yo-rc.json": yoRc({
            project: { type: "lib", packageManager: "bun", ci: true },
            monorepo: { ci: true, typescript: true },
          }),
        },
        facts: { isMonorepoRoot: true },
      }),
      [releaseStep],
    );
    const workflow = plannedContent(plan, ".github/workflows/release.yml");
    expect(workflow).toContain("      bump-dependents-highest-as:\n");
    expect(workflow).toContain(
      "      - name: Install bun\n        uses: oven-sh/setup-bun@v2\n",
    );
    expect(workflow).toContain(
      "      - name: Install Dependencies\n        run: bun install --frozen-lockfile\n\n      - name: Build\n        run: bun run build\n",
    );
    expect(workflow).toContain(
      `          bun run pob-version --publish --publish-provenance --create-release=github --bump-dependents-highest-as=${githubExpression("inputs.bump-dependents-highest-as")} ${githubExpression("inputs.force != 'none' && format('--force={0}', inputs.force) || ''")} -m 'chore: release [skip ci]\\n\\n%t'\n`,
    );
    expect(workflow).not.toContain("Publish to npm");
  });

  test("pnpm monorepo app project: no publish without public package", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: {
          "package.json": json({
            name: "root",
            private: true,
            version: "1.0.0",
          }),
          ".yo-rc.json": yoRc({
            project: { type: "app", packageManager: "pnpm", ci: true },
            monorepo: { ci: true },
          }),
        },
        facts: { isMonorepoRoot: true },
      }),
      [releaseStep],
    );
    const workflow = plannedContent(plan, ".github/workflows/release.yml");
    expect(workflow).toContain("-m 'chore: release %v [skip ci]'\n");
    expect(workflow).not.toContain("bump-dependents");
    expect(workflow).not.toContain("Publish to npm");
    expect(workflow).not.toContain("- name: Build");
  });
});

describe("release legacy", () => {
  test("removes the pob-version version script only", async () => {
    const run = (version: string) =>
      runTestSteps(
        createTestContext({
          files: {
            "package.json": json({
              name: "lib",
              scripts: { version, release: "standard-version" },
            }),
            ".yo-rc.json": libYoRc({}),
          },
        }),
        [legacyStepOf(releaseLegacyPart)],
      );
    const removed = await run("pob-version");
    expect(
      parse(plannedContent(removed, "package.json")).scripts,
    ).toBeUndefined();
    const kept = await run("echo");
    expect(parse(plannedContent(kept, "package.json")).scripts).toEqual({
      version: "echo",
    });
  });
});

describe("old dependencies legacy", () => {
  test("keeps @pob/version in pob-monorepo", async () => {
    const run = (name: string) =>
      runTestSteps(
        createTestContext({
          files: {
            "package.json": json({
              name,
              dependencies: { "flow-runtime": "1.0.0" },
              devDependencies: { "@pob/version": "1.0.0", jest: "1.0.0" },
            }),
            ".yo-rc.json": libYoRc({}),
          },
        }),
        [legacyStepOf(oldDependenciesLegacyPart)],
      );
    const lib = parse(plannedContent(await run("lib"), "package.json"));
    expect(lib.dependencies).toBeUndefined();
    expect(lib.devDependencies).toBeUndefined();
    const pobMonorepo = parse(
      plannedContent(await run("pob-monorepo"), "package.json"),
    );
    expect(pobMonorepo.devDependencies).toEqual({ "@pob/version": "1.0.0" });
  });
});
