import type { PobConfig, ProjectConfig } from "../../engine/config.ts";
import type { RepoFacts } from "../../engine/context.ts";
import type { JsonObject } from "../../engine/model.ts";
import type { Plan } from "../../engine/plan.ts";
import { plannedContent } from "../../engine/testing.ts";

export const json = (value: unknown): string =>
  `${JSON.stringify(value, null, 2)}\n`;

export const yoRc = (pob: unknown): string => json({ pob });

export const author = "Test Author <test@example.com> (https://example.com)";

export const rootProject: ProjectConfig = {
  type: "lib",
  packageManager: "yarn",
  ci: true,
};

export const monorepoRootConfig: PobConfig = {
  project: rootProject,
  monorepo: { typescript: true },
};

export const monorepoRootPkg: JsonObject = {
  name: "root",
  license: "MIT",
  type: "module",
  author,
  homepage: "https://github.com/test/root",
  bugs: { url: "https://github.com/test/root/issues" },
  repository: "https://github.com/test/root.git",
  workspaces: ["packages/*"],
};

export const inMonorepoFacts = (
  rootPkg: JsonObject = monorepoRootPkg,
): Partial<Omit<RepoFacts, "packageManager" | "yarnNodeLinker">> => ({
  isRoot: false,
  inMonorepo: {
    rootDir: "/test",
    relative: "packages/a",
    rootPkg,
    rootConfig: monorepoRootConfig,
  },
});

export const plannedPkg = (plan: Plan): JsonObject =>
  JSON.parse(plannedContent(plan, "package.json") ?? "{}") as JsonObject;

export const plannedOp = (plan: Plan, filePath: string): string | undefined =>
  plan.files.find((file) => file.path === filePath)?.op;
