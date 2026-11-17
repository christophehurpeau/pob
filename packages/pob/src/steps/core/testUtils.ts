import type { PobConfig } from "../../engine/config.ts";
import type { RepoFacts } from "../../engine/context.ts";

export const json = (value: unknown): string =>
  `${JSON.stringify(value, null, 2)}\n`;

export const yoRc = (pob: unknown): string => json({ pob });

export const rootProject = {
  type: "lib",
  packageManager: "yarn",
  yarnNodeLinker: "node-modules",
  ci: true,
} as const;

export const monorepoRootConfig: PobConfig = {
  project: rootProject,
  monorepo: { typescript: true },
  renovate: { enable: true },
};

/** facts of a package inside a monorepo */
export const inMonorepoFacts: Partial<
  Omit<RepoFacts, "packageManager" | "yarnNodeLinker">
> = {
  isRoot: false,
  inMonorepo: {
    rootDir: "/test",
    relative: "packages/a",
    rootPkg: { name: "root", workspaces: ["packages/*"] },
    rootConfig: monorepoRootConfig,
  },
};
