import { describe, expect, test } from "vitest";
import type { Plan } from "../../engine/plan.ts";
import {
  createTestContext,
  plannedContent,
  runTestSteps,
} from "../../engine/testing.ts";
import { claudeStep } from "./claude.ts";
import { cleanStep } from "./clean.ts";
import { editorconfigStep } from "./editorconfig.ts";
import {
  inMonorepoFacts,
  json,
  monorepoRootConfig,
  rootProject,
  yoRc,
} from "./testUtils.ts";
import { vscodeStep } from "./vscode.ts";
import { tsrsTsdkTsgo } from "./vscodeTemplates.ts";

const libFiles = (
  project: Record<string, unknown> = rootProject,
): Record<string, string> => ({
  ".yo-rc.json": yoRc({ project, lib: {} }),
  "package.json": json({
    name: "lib",
    pob: { bundler: "tsc", typescript: true },
  }),
});

const packageFiles: Record<string, string> = {
  ".yo-rc.json": yoRc({ project: { type: "lib" }, lib: {} }),
  "package.json": json({ name: "a" }),
  ".idea/workspace.xml": "",
  ".vscode/settings.json": "{}",
  ".claude/settings.json": "{}",
  ".claude/.gitignore": "",
};

const fileOp = (plan: Plan, filePath: string): string | undefined =>
  plan.files.find((file) => file.path === filePath)?.op;

describe("monorepo package", () => {
  test("removes IDE and claude settings", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: packageFiles,
        facts: inMonorepoFacts,
        rootConfig: monorepoRootConfig,
      }),
      [editorconfigStep, cleanStep, vscodeStep, claudeStep],
    );
    expect(
      plan.files.map(({ path, op }) => `${op} ${path}`).toSorted(),
    ).toEqual([
      "create .editorconfig",
      "delete .claude/.gitignore",
      "delete .claude/settings.json",
      "delete .idea",
      "delete .vscode",
    ]);
  });
});

describe("claude", () => {
  test("adds the hook to existing settings", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: {
          ...libFiles(),
          ".claude/settings.json": json({
            permissions: { allow: ["Bash(ls)"] },
            hooks: {
              PostToolUse: [
                {
                  matcher: "Edit|Write|MultiEdit",
                  hooks: [{ type: "command", command: "echo" }],
                },
              ],
            },
          }),
        },
      }),
      [claudeStep],
    );
    expect(
      JSON.parse(plannedContent(plan, ".claude/settings.json") ?? ""),
    ).toEqual({
      permissions: { allow: ["Bash(ls)"] },
      hooks: {
        PostToolUse: [
          {
            matcher: "Edit|Write|MultiEdit",
            hooks: [
              { type: "command", command: "echo" },
              {
                type: "command",
                command: "./node_modules/.bin/pob-claude-run-lint-staged",
              },
            ],
          },
        ],
      },
    });
    expect(plannedContent(plan, ".claude/.gitignore")).toContain(
      "/settings.local.json",
    );
  });

  test("runs the hook from sources in pob-monorepo", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: {
          ".yo-rc.json": yoRc({ project: rootProject, monorepo: {} }),
          "package.json": json({ name: "pob-monorepo", workspaces: [] }),
        },
        facts: { isMonorepoRoot: true },
      }),
      [claudeStep],
    );
    expect(plannedContent(plan, ".claude/settings.json")).toContain(
      "node ./@pob/root/bin/pob-claude-run-lint-staged.js",
    );
  });
});

describe("vscode", () => {
  test("keeps the tasks and makes the tsdk script executable", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: {
          ...libFiles(),
          ".vscode/tasks.json": `{
  // comment
  "version": "2.0.0",
  "tasks": [{ label: "build", type: "shell", command: "make" }],
}
`,
        },
      }),
      [vscodeStep],
    );
    expect(plannedContent(plan, ".vscode/tasks.json")).toContain(
      '"command": "make"',
    );
    expect(plannedContent(plan, ".vscode/tsrs-tsdk/tsgo")).toBe(tsrsTsdkTsgo);
    expect(plan.effects.map((effect) => effect.id)).toEqual([
      "vscode-tsdk-chmod",
    ]);
  });

  test("does not chmod an unchanged executable tsdk script", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: { ...libFiles(), ".vscode/tsrs-tsdk/tsgo": tsrsTsdkTsgo },
        executableFiles: [".vscode/tsrs-tsdk/tsgo"],
      }),
      [vscodeStep],
    );
    expect(plan.effects).toEqual([]);
  });

  test("chmods an unchanged tsdk script that is not executable", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: { ...libFiles(), ".vscode/tsrs-tsdk/tsgo": tsrsTsdkTsgo },
      }),
      [vscodeStep],
    );
    expect(fileOp(plan, ".vscode/tsrs-tsdk/tsgo")).toBe(undefined);
    expect(plan.effects.map((effect) => effect.id)).toEqual([
      "vscode-tsdk-chmod",
    ]);
  });

  test("pnp has no tsrs tsdk", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: {
          ...libFiles({ ...rootProject, yarnNodeLinker: "pnp" }),
          ".vscode/tsrs-tsdk/tsgo": tsrsTsdkTsgo,
        },
      }),
      [vscodeStep],
    );
    expect(fileOp(plan, ".vscode/tsrs-tsdk/tsgo")).toBe("delete");
    expect(plannedContent(plan, ".vscode/extensions.json")).toContain(
      "arcanis.vscode-zipfs",
    );
    expect(plannedContent(plan, ".vscode/settings.json")).not.toContain(
      "js/ts.tsdk.path",
    );
  });

  test("monorepo root with an alouette app recommends tailwind", async () => {
    const appPackage = createTestContext({
      location: "packages/app",
      files: {
        ".yo-rc.json": yoRc({
          project: { type: "app" },
          app: { type: "expo" },
        }),
        "package.json": json({
          name: "app",
          dependencies: { alouette: "1.0.0" },
        }),
      },
      facts: inMonorepoFacts,
      rootConfig: monorepoRootConfig,
    });
    const plan = await runTestSteps(
      createTestContext({
        files: {
          ".yo-rc.json": yoRc({ project: rootProject, monorepo: {} }),
          "package.json": json({ name: "root", workspaces: ["packages/*"] }),
        },
        facts: { isMonorepoRoot: true },
        workspacePackages: [appPackage],
      }),
      [vscodeStep],
    );
    expect(plannedContent(plan, ".vscode/extensions.json")).toContain(
      "bradlc.vscode-tailwindcss",
    );
    expect(plannedContent(plan, ".vscode/settings.json")).toContain(
      '"tailwindCSS.classFunctions": ["tv"]',
    );
    expect(plannedContent(plan, ".vscode/extensions.json")).not.toContain(
      "TypeScriptTeam.native-preview",
    );
  });
});
