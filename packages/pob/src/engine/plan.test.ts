import { describe, expect, test } from "vitest";
import type { PlannedFile } from "./plan.ts";
import { formatPlan } from "./plan.ts";

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
