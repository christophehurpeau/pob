import { unifiedDiff } from "./diff.ts";
import type { FileStrategy } from "./output.ts";

export interface PlannedFile {
  /** relative to the directory pob runs in */
  path: string;
  op: "create" | "modify" | "delete";
  /** deleted directory: `before` is undefined */
  directory?: boolean;
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
  plan.files.length === 0 && plan.effects.length === 0;

const header = (file: PlannedFile): string => {
  const owners = file.owners.join(", ");
  if (file.op === "delete" && file.directory) {
    return `delete directory ${file.path} (${owners})`;
  }
  return `${file.op} ${file.path} (${file.strategy}, ${owners})`;
};

/** --check output: unified diffs, then the effects that would run. */
export const formatPlan = (plan: Plan): string => {
  const lines: string[] = [];
  for (const file of plan.files) {
    lines.push(header(file));
    if (file.directory) continue;
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
