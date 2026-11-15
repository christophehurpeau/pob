import path from "node:path";
import { diffStats, unifiedDiff } from "./diff.ts";
import type { FileStrategy } from "./output.ts";

export interface PlannedFile {
  /** relative to the directory pob runs in */
  path: string;
  op: "create" | "modify" | "delete";
  /** deleted directory: `before` is undefined */
  directory?: boolean;
  /** regenerated output of a tool, deleted without failing --check */
  transient?: boolean;
  before?: string;
  after?: string;
  strategy: FileStrategy;
  owners: string[];
}

export interface PlanEffect {
  id: string;
  cwd: string;
  reasons: string[];
  owners: string[];
  command?: string;
  after: string[];
  mayModify: string[];
}

export interface Plan {
  files: PlannedFile[];
  effects: PlanEffect[];
  warnings: string[];
}

export const isPlanEmpty = (plan: Plan): boolean =>
  plan.files.every((file) => file.transient) && plan.effects.length === 0;

const header = (file: PlannedFile): string => {
  const owners = file.owners.join(", ");
  if (file.op === "delete" && file.directory) {
    return `delete directory ${file.path} (${owners}${file.transient ? ", transient" : ""})`;
  }
  return `${file.op} ${file.path} (${file.strategy}, ${owners})`;
};

const lockfileNames = new Set([
  "bun.lock",
  "bun.lockb",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
]);

/** generated, often tens of thousands of lines: a diff would drown the plan */
const isLockfile = (filePath: string): boolean =>
  lockfileNames.has(path.posix.basename(filePath));

/** --check output: unified diffs, then the effects that would run. */
export const formatPlan = (plan: Plan): string => {
  const lines: string[] = [];
  for (const file of plan.files) {
    lines.push(header(file));
    if (file.directory) continue;
    if (isLockfile(file.path)) {
      const { removed, added } = diffStats(file.before ?? "", file.after ?? "");
      lines.push(
        `  lockfile: ${removed} line(s) removed, ${added} line(s) added, diff not shown`,
      );
      continue;
    }
    lines.push(`--- a/${file.path}`, `+++ b/${file.path}`);
    const diff = unifiedDiff(file.before ?? "", file.after ?? "");
    if (diff) lines.push(diff);
  }
  if (plan.effects.length > 0) {
    lines.push("", "effects:");
    for (const effect of plan.effects) {
      const location = effect.cwd === "." ? "" : ` in ${effect.cwd}`;
      lines.push(
        `  ${effect.id}${location}${effect.command ? `: ${effect.command}` : ""} (${effect.reasons.join("; ")})`,
      );
      if (effect.mayModify.length > 0) {
        lines.push(`    may modify: ${effect.mayModify.join(", ")}`);
      }
    }
  }
  for (const warning of plan.warnings) lines.push(`warning: ${warning}`);
  return lines.join("\n");
};

export const serializePlan = (plan: Plan): string =>
  JSON.stringify(plan, null, 2);
