import { describe, expect, test } from "vitest";
import {
  createTestContext,
  plannedContent,
  runTestSteps,
} from "../../engine/testing.ts";
import { typescriptStep } from "./typescript.ts";

const yoRc = (pob: unknown): string => JSON.stringify({ pob });

const parse = (content: string | undefined): Record<string, unknown> =>
  JSON.parse(content ?? "{}") as Record<string, unknown>;

const appFiles = (app: unknown, pkg: unknown = { name: "app" }) => ({
  "package.json": JSON.stringify(pkg),
  ".yo-rc.json": yoRc({
    project: { type: "app", packageManager: "yarn", ci: true },
    app,
  }),
});

describe("typescript", () => {
  test("next.js app", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: appFiles(
          { type: "next.js" },
          { name: "app", dependencies: { react: "19.0.0" } },
        ),
      }),
      [typescriptStep],
    );
    const tsconfig = plannedContent(plan, "tsconfig.json") ?? "";
    expect(tsconfig).toContain('"jsx": "preserve"');
    expect(tsconfig).toContain('"plugins": [{ "name": "next" }]');
    expect(tsconfig).toContain('"exclude": ["node_modules"]');
    expect(tsconfig).toContain('"#/*": ["./src/*"]');
    expect(tsconfig).toContain("@pob/root/tsconfigs/targets/webpack.json");
    expect(parse(plannedContent(plan, "package.json")).scripts).toEqual({
      tsc: "tsrs && tsrs -p tsconfig.tools.json",
      "tsc:go": "tsc && tsc -p tsconfig.tools.json",
    });
    expect(plannedContent(plan, "tsconfig.tools.json")).toContain(
      "tsbuildinfo-tools",
    );
  });

  test("check-only lib", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: {
          "package.json": JSON.stringify({
            name: "lib",
            pob: { typescript: "check-only" },
          }),
          ".yo-rc.json": yoRc({
            project: { type: "lib", packageManager: "npm", ci: true },
            lib: {},
          }),
        },
      }),
      [typescriptStep],
    );
    const tsconfig = plannedContent(plan, "tsconfig.json") ?? "";
    expect(tsconfig).toContain('"checkJs": true');
    expect(tsconfig).toContain('"lib/**/*.js"');
  });

  test("without typescript: removes the configs and the scripts", async () => {
    const plan = await runTestSteps(
      createTestContext({
        files: {
          "package.json": JSON.stringify({
            name: "lib",
            scripts: { tsc: "tsrs", "tsc:go": "tsc" },
            devDependencies: { tsrs: "1.0.0" },
          }),
          ".yo-rc.json": yoRc({
            project: { type: "lib", packageManager: "npm", ci: true },
            lib: {},
          }),
          "tsconfig.json": "{}",
          "tsconfig.tools.json": "{}",
        },
      }),
      [typescriptStep],
    );
    expect(
      plan.files
        .filter(({ op }) => op === "delete")
        .map(({ path }) => path)
        .toSorted(),
    ).toEqual(["tsconfig.json", "tsconfig.tools.json"]);
    const pkg = parse(plannedContent(plan, "package.json"));
    expect(pkg.scripts).toBeUndefined();
    expect(pkg.devDependencies).toBeUndefined();
  });

  test("node app in a monorepo package: no tsconfig.tools.json", async () => {
    const plan = await runTestSteps(
      createTestContext({
        location: "packages/api",
        files: {
          ...appFiles({ type: "node" }),
          ".yo-rc.json": yoRc({
            project: { type: "app" },
            app: { type: "node" },
          }),
          "tsconfig.tools.json": "{}",
        },
        facts: {
          isRoot: false,
          inMonorepo: {
            rootDir: "/test",
            relative: "packages/api",
            rootPkg: { workspaces: ["packages/*"] },
            rootConfig: {
              project: { type: "app", packageManager: "pnpm" },
              monorepo: { typescript: "check-only" },
            },
          },
        },
      }),
      [typescriptStep],
    );
    expect(
      plan.files.find(({ path }) => path === "packages/api/tsconfig.tools.json")
        ?.op,
    ).toBe("delete");
    const tsconfig = plannedContent(plan, "packages/api/tsconfig.json") ?? "";
    expect(tsconfig).toContain('"checkJs": true');
    expect(tsconfig).not.toContain('"composite"');
  });
});
