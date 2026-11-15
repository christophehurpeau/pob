import fs from "node:fs";
import type { BuildConfig } from "../../engine/config.ts";
import type {
  MonorepoWorkspace,
  PackageContext,
} from "../../engine/context.ts";
import type { JsonObject } from "../../engine/model.ts";
import { resolveOutput } from "../../engine/output.ts";

/**
 * Content of a file of a workspace package after its steps ran: its planned
 * output, or its current content when no step outputs it. The yeoman monorepo
 * generator read these files from disk before the packages were updated, so a
 * file created in a package needed a second run to reach the root.
 */
export const finalFileContent = (
  packageContext: PackageContext,
  filePath: string,
): string | undefined => {
  const output = packageContext.output.get(filePath);
  if (!output) return packageContext.initial.read(filePath);
  const rendered = resolveOutput(output, packageContext.initial);
  if (rendered.kind === "delete") return undefined;
  if (rendered.kind === "keep") return packageContext.initial.read(filePath);
  return rendered.content;
};

/** package.json of a workspace package after its steps ran */
export const finalPkg = (packageContext: PackageContext): JsonObject =>
  packageContext.pkg.snapshot();

/**
 * A file of a workspace once pob ran: the final output of a workspace with a
 * pob config, the current content of one without, which pob does not update.
 */
export const workspaceFileContent = (
  workspace: MonorepoWorkspace,
  filePath: string,
): string | undefined =>
  workspace.context
    ? finalFileContent(workspace.context, filePath)
    : workspace.initial.read(filePath);

export const workspacePkg = (workspace: MonorepoWorkspace): JsonObject =>
  workspace.context ? finalPkg(workspace.context) : workspace.pkg;

/** the build config, from package.json#pob for a workspace without config */
export const workspaceBuildConfig = (
  workspace: MonorepoWorkspace,
): BuildConfig | undefined =>
  workspace.context
    ? workspace.context.config.build
    : (workspace.pkg.pob as BuildConfig | undefined);

/**
 * Names in the directory of the context. InitialFiles only lists files
 * recursively, which would walk node_modules: the yeoman generators used
 * readdirSync and `rm -Rf lib-*` here.
 */
export const listRootEntries = (ctx: PackageContext): string[] => {
  try {
    return fs.readdirSync(ctx.dir).toSorted();
  } catch {
    return [];
  }
};
