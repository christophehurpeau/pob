import path from "node:path";
import type { PackageContext } from "../../engine/context.ts";
import type { JsonObject } from "../../engine/model.ts";
import { defineStep } from "../../engine/step.ts";
import { getWorkspaceGlobs } from "../../engine/workspace.ts";
import { extractMonorepoReadmeContent } from "../../utils/misc.ts";
import { workspacePkg } from "./packages.ts";
import { isMonorepoRoot } from "./settings.ts";
import { monorepoReadmeTemplate } from "./templates.ts";

const defaultWorkspaces = ["packages/*"];

/** eslint runs out of memory on large monorepos with the default heap */
const LARGE_MONOREPO_PACKAGES = 15;

const setEngines = (ctx: PackageContext): void => {
  const { pkg } = ctx;
  switch (ctx.facts.packageManager) {
    case "npm":
      pkg.set("engines.yarn", "< 0.0.0");
      pkg.set("engines.npm", ">= 6.4.0");
      break;
    case "pnpm":
      // checks the version locally: devEngines.packageManager is ignored by
      // pnpm
      pkg.set("engines.pnpm", ">= 12.0.0");
      pkg.delete("engines.yarn");
      break;
    case "yarn":
    case "bun":
      pkg.delete("engines.pnpm");
      pkg.delete("engines.yarn");
      break;
    default:
      throw new Error(
        `Unsupported package manager: ${String(ctx.facts.packageManager)}`,
      );
  }
};

const setLintScripts = (ctx: PackageContext): void => {
  const { pkg } = ctx;
  const packageManager = ctx.facts.packageManager;
  pkg.addScripts({
    lint: `${packageManager} run format && ${packageManager} run lint:oxlint && ${packageManager} run lint:eslint`,
    format: "oxfmt",
    "format:check": "oxfmt --check .",
  });
  const eslintScripts = {
    "lint:oxlint": "oxlint --quiet",
    "lint:eslint": `${
      ctx.workspacePackages.length > LARGE_MONOREPO_PACKAGES
        ? "NODE_OPTIONS=--max_old_space_size=4096 "
        : ""
    }eslint --quiet .`,
  };
  pkg.addOrRemoveScripts(ctx.config.monorepo?.eslint, eslintScripts);
};

/**
 * The packages of each workspace glob, in the order of the globs then of
 * their directory names, like the readdirSync of the yeoman generator.
 */
const getReadmePackages = (
  ctx: PackageContext,
  workspaceGlobs: readonly string[],
): JsonObject[] =>
  workspaceGlobs
    .map((workspaceGlob) => workspaceGlob.replace(/\/\*$/, ""))
    .flatMap((directory) =>
      ctx.monorepoWorkspaces
        .filter(
          (workspace) => path.posix.dirname(workspace.location) === directory,
        )
        .toSorted((a, b) => (a.location < b.location ? -1 : 1)),
    )
    .map((workspace) => workspacePkg(workspace));

/** root package.json scripts, engines and workspaces, and the README */
export const monorepoWorkspacesStep = defineStep<PackageContext>({
  name: "monorepo-workspaces",
  when: isMonorepoRoot,
  reads: ["pkg.name", "pkg.description"],
  writes: [
    "pkg.engines.npm",
    "pkg.engines.pnpm",
    "pkg.engines.yarn",
    "pkg.scripts.lint",
    "pkg.scripts.format",
    "pkg.scripts.format:check",
    "pkg.scripts.lint:oxlint",
    "pkg.scripts.lint:eslint",
    "pkg.workspaces",
    "files:README.md",
  ],
  run: (ctx) => {
    const { pkg } = ctx;
    setEngines(ctx);
    setLintScripts(ctx);
    if (!pkg.get("workspaces")) pkg.set("workspaces", defaultWorkspaces);

    const name = pkg.get<string>("name") ?? "";
    const title =
      pkg.get<string>("description") || name.replace(/-monorepo$/, "");
    const packages = getReadmePackages(
      ctx,
      getWorkspaceGlobs({ workspaces: pkg.get("workspaces") }),
    );
    ctx.output.section(
      "README.md",
      (current) =>
        monorepoReadmeTemplate({
          title,
          packages,
          content:
            current === undefined ? "" : extractMonorepoReadmeContent(current),
        }),
      { format: "oxfmt" },
    );
  },
});
