import type { PobConfig } from "./config.ts";
import type { PackageContext, PobStep, RepoFacts } from "./context.ts";
import { createMemoryFiles } from "./files.ts";
import { createPackageContext, renderContext, runSteps } from "./pipeline.ts";
import type { Plan } from "./plan.ts";
import { orderSteps } from "./step.ts";
import type { DependencyVersions } from "./versions.ts";

export interface TestContextOptions {
  files: Record<string, string>;
  facts?: Partial<Omit<RepoFacts, "packageManager" | "yarnNodeLinker">>;
  rootConfig?: PobConfig;
  versions?: DependencyVersions;
  workspacePackages?: PackageContext[];
  location?: string;
}

/** fixed versions, so that tests do not change with pob-dependencies */
export const testVersions: DependencyVersions = (dependency) =>
  `${dependency.length}.0.0`;

/** A package context over in-memory files, with strict access checks. */
export const createTestContext = ({
  files,
  facts,
  rootConfig,
  versions = testVersions,
  workspacePackages = [],
  location = ".",
}: TestContextOptions): PackageContext => {
  const ctx = createPackageContext({
    location,
    dir: `/test/${location}`,
    initial: createMemoryFiles(files),
    facts: {
      isMonorepoRoot: false,
      isRoot: true,
      originUrl: "https://github.com/test/test.git",
      inMonorepo: undefined,
      ...facts,
    },
    rootConfig,
    versions,
    strict: true,
    options: { check: true, fromPob: false },
    warnings: [],
  });
  ctx.workspacePackages = workspacePackages;
  return ctx;
};

/** Runs steps on a context and renders it, without touching the disk. */
export const runTestSteps = async (
  ctx: PackageContext,
  steps: readonly PobStep[],
): Promise<Plan> => {
  await runSteps(ctx, orderSteps(steps));
  const { files, warnings } = await renderContext(ctx);
  return {
    files,
    effects: ctx.effects.list().map((effect) => ({
      id: effect.id,
      cwd: effect.cwd ?? ".",
      reasons: effect.reasons,
      owners: effect.owners,
      command: effect.command,
      after: [...(effect.after ?? [])],
      mayModify: [...(effect.mayModify ?? [])],
    })),
    warnings,
  };
};

/** Content of a planned file, by path. */
export const plannedContent = (
  plan: Plan,
  filePath: string,
): string | undefined =>
  plan.files.find((file) => file.path === filePath)?.after;
