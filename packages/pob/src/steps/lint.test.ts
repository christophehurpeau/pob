import { describe, expect, test } from "vitest";
import {
  createTestContext,
  plannedContent,
  runTestSteps,
} from "../engine/testing.ts";
import { lintStep } from "./lint.ts";

const yoRc = (pob: unknown): string => JSON.stringify({ pob });

const tsLibFiles = {
  "package.json": JSON.stringify({
    name: "lib",
    type: "module",
    pob: { bundler: "rollup-esbuild", typescript: true },
  }),
  ".yo-rc.json": yoRc({
    project: { type: "lib", packageManager: "pnpm", ci: true },
    lib: { testing: false },
  }),
};

const parse = (content: string | undefined): Record<string, unknown> =>
  JSON.parse(content ?? "{}") as Record<string, unknown>;

describe("lint", () => {
  test("standalone typescript lib", async () => {
    const plan = await runTestSteps(createTestContext({ files: tsLibFiles }), [
      lintStep,
    ]);
    const pkg = parse(plannedContent(plan, "package.json"));
    expect(pkg.scripts).toEqual({
      format: "oxfmt",
      "format:check": "oxfmt --check .",
      lint: "pnpm run format && pnpm run lint:oxlint && tsrs && pnpm run lint:eslint",
      "lint:eslint": "eslint --quiet .",
      "lint:oxlint": "oxlint --quiet",
    });
    expect(pkg.devDependencies).toEqual({
      "@pob/eslint-config": "18.0.0",
      eslint: "6.0.0",
    });
    expect(plannedContent(plan, "eslint.config.js")).toBe(
      `import pobConfig from "@pob/eslint-config";

export default [...pobConfig.configs.node, ...pobConfig.configs.toolsProject];
`,
    );
    expect(parse(plannedContent(plan, ".oxlintrc.json"))).toEqual({
      extends: [
        "./node_modules/@pob/eslint-config/oxlint/base.json",
        "./node_modules/@pob/eslint-config/oxlint/module.json",
        "./node_modules/@pob/eslint-config/oxlint/node.json",
        "./node_modules/@pob/eslint-config/oxlint/typescript.json",
      ],
      ignorePatterns: [
        ".yarn",
        "**/dist/",
        "**/build/",
        "**/coverage/",
        "**/.next/",
        "**/.tamagui/",
        "**/.expo/",
        "**/*.d.ts",
        "/dist",
      ],
    });
  });

  test("keeps an eslint.config.js edited by hand, with a warning for react", async () => {
    const files = {
      ...tsLibFiles,
      "package.json": JSON.stringify({
        name: "lib",
        type: "module",
        dependencies: { react: "19.0.0" },
        pob: { bundler: "rollup-esbuild", typescript: true },
      }),
      "eslint.config.js": "export default [];\n",
    };
    const plan = await runTestSteps(createTestContext({ files }), [lintStep]);
    expect(plannedContent(plan, "eslint.config.js")).toBeUndefined();
    expect(plan.warnings).toEqual([
      "eslint.config.js was edited by hand and is not updated: use the configs of @pob/eslint-config-typescript-react to lint react",
    ]);
  });

  test("updates an eslint.config.js generated for other options", async () => {
    const reactFiles = {
      ...tsLibFiles,
      "package.json": JSON.stringify({
        name: "lib",
        type: "module",
        dependencies: { react: "19.0.0" },
        pob: { bundler: "rollup-esbuild", typescript: true },
      }),
    };
    const reactEslintConfig = plannedContent(
      await runTestSteps(createTestContext({ files: reactFiles }), [lintStep]),
      "eslint.config.js",
    );
    expect(reactEslintConfig).toContain("pobTypescriptConfigReact");
    const plan = await runTestSteps(
      createTestContext({
        files: { ...tsLibFiles, "eslint.config.js": reactEslintConfig ?? "" },
      }),
      [lintStep],
    );
    expect(plannedContent(plan, "eslint.config.js")).not.toContain(
      "pobTypescriptConfigReact",
    );
  });

  test("plans the codemods for @pob/eslint-config before 68", async () => {
    const files = {
      ...tsLibFiles,
      "package.json": JSON.stringify({
        name: "lib",
        devDependencies: { "@pob/eslint-config": "^60.0.0" },
        pob: { bundler: "rollup-esbuild", typescript: true },
      }),
    };
    const plan = await runTestSteps(createTestContext({ files }), [lintStep]);
    expect(plan.effects.map(({ id, after }) => ({ id, after }))).toEqual([
      { id: "codemods:oxlint-only", after: ["install"] },
    ]);
  });

  test("monorepo package: lints from the root", async () => {
    const plan = await runTestSteps(
      createTestContext({
        location: "packages/a",
        files: {
          "package.json": JSON.stringify({
            name: "a",
            pob: { bundler: "rollup-esbuild", typescript: true },
            devDependencies: { eslint: "1.0.0" },
          }),
          ".yo-rc.json": yoRc({ project: { type: "lib" }, lib: {} }),
          ".oxlintrc.json": "{}",
        },
        facts: {
          isRoot: false,
          inMonorepo: {
            rootDir: "/test",
            relative: "packages/a",
            rootPkg: {},
            rootConfig: {
              project: { type: "lib", packageManager: "yarn" },
              monorepo: { eslint: true, typescript: true },
            },
          },
        },
      }),
      [lintStep],
    );
    const pkg = parse(plannedContent(plan, "packages/a/package.json"));
    expect(pkg.scripts).toEqual({
      lint: "yarn run lint:oxlint && yarn run lint:eslint",
      "lint:eslint": "yarn '../..' run eslint --quiet 'packages/a'",
      "lint:oxlint": "yarn '../..' run oxlint --quiet 'packages/a'",
    });
    expect(pkg.devDependencies).toBeUndefined();
    expect(plan.files.map(({ path, op }) => `${op} ${path}`)).toEqual([
      "modify packages/a/package.json",
      "delete packages/a/.oxlintrc.json",
    ]);
  });
});
