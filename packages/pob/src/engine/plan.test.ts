import { describe, expect, test } from "vitest";
import type { Plan, PlanEffect, PlannedFile } from "./plan.ts";
import { formatPlan, isPlanEmpty, serializePlan } from "./plan.ts";

const file = (overrides: Partial<PlannedFile>): PlannedFile => ({
  path: "a.txt",
  op: "modify",
  strategy: "owned",
  owners: ["step"],
  ...overrides,
});

describe("formatPlan", () => {
  test("renders a unified diff of a file", () => {
    expect(
      formatPlan({
        files: [file({ before: "a\n", after: "b\n" })],
        effects: [],
        warnings: [],
      }),
    ).toBe(
      [
        "modify a.txt (owned, step)",
        "--- a/a.txt",
        "+++ b/a.txt",
        "@@ -1,1 +1,1 @@",
        "-a",
        "+b",
      ].join("\n"),
    );
  });

  test("summarizes the changes of a lockfile instead of diffing it", () => {
    const lines = (prefix: string, count: number): string =>
      Array.from({ length: count }, (_, index) => `${prefix}${index}\n`).join(
        "",
      );
    expect(
      formatPlan({
        files: [
          file({
            path: "packages/a/pnpm-lock.yaml",
            before: lines("a", 3000),
            after: `${lines("a", 2990)}${lines("b", 20)}`,
          }),
          file({
            path: "yarn.lock",
            op: "delete",
            strategy: "removed",
            before: lines("a", 5000),
          }),
        ],
        effects: [],
        warnings: [],
      }),
    ).toBe(
      [
        "modify packages/a/pnpm-lock.yaml (owned, step)",
        "  lockfile: 10 line(s) removed, 20 line(s) added, diff not shown",
        "delete yarn.lock (removed, step)",
        "  lockfile: 5000 line(s) removed, 0 line(s) added, diff not shown",
      ].join("\n"),
    );
  });
});

const effect = (overrides: Partial<PlanEffect>): PlanEffect => ({
  id: "install",
  cwd: ".",
  reasons: ["dependencies changed"],
  owners: ["step"],
  after: [],
  mayModify: [],
  ...overrides,
});

describe("effects", () => {
  test("the github sync is listed but does not make --check fail", () => {
    const plan: Plan = {
      files: [],
      effects: [
        effect({ id: "github-sync", reasons: ["sync the settings of a/b"] }),
      ],
      warnings: [],
    };
    expect(isPlanEmpty(plan)).toBe(true);
    expect(formatPlan(plan)).toBe(
      [
        "",
        "effects:",
        "  github-sync (sync the settings of a/b, on every update)",
      ].join("\n"),
    );
    expect(isPlanEmpty({ ...plan, effects: [effect({})] })).toBe(false);
  });

  test("hides the credentials of urls in effects and warnings", () => {
    const plan: Plan = {
      files: [],
      effects: [
        effect({
          id: "git-remote-add",
          command: "git remote add origin https://token@gitlab.com/o/r.git",
          reasons: ["origin https://u:p@gitlab.com/o/r.git"],
        }),
      ],
      warnings: ["unknown git host in https://u:secret@git.corp/o/r.git"],
    };
    for (const output of [formatPlan(plan), serializePlan(plan)]) {
      expect(output).not.toMatch(/token|secret|u:p/);
      expect(output).toContain("https://***@gitlab.com/o/r.git");
    }
  });
});
