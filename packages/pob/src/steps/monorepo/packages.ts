import fs from "node:fs";
import type { PackageContext } from "../../engine/context.ts";
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
