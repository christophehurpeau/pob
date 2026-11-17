import { describe, expect, test } from "vitest";
import { diffLines, unifiedDiff } from "./diff.ts";

/** length of the longest common subsequence, quadratic: small inputs only */
const lcsLength = (a: string[], b: string[]): number => {
  let previous = Array.from({ length: b.length + 1 }, () => 0);
  for (const line of a) {
    const row = [0];
    for (const [j, other] of b.entries()) {
      row.push(
        line === other
          ? (previous[j] ?? 0) + 1
          : Math.max(previous[j + 1] ?? 0, row[j] ?? 0),
      );
    }
    previous = row;
  }
  return previous[b.length] ?? 0;
};

/** a deterministic pseudo-random generator */
const createRandom = (seed: number): (() => number) => {
  let state = seed;
  return () => {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648;
    return state / 2_147_483_648;
  };
};

describe("diffLines", () => {
  test("is a minimal edit script that rebuilds both sides", () => {
    const random = createRandom(42);
    const randomLines = (): string[] =>
      Array.from({ length: Math.floor(random() * 12) }, () =>
        String.fromCodePoint(97 + Math.floor(random() * 4)),
      );
    for (let run = 0; run < 500; run++) {
      const before = randomLines();
      const after = randomLines();
      const operations = diffLines(before, after);
      expect(
        operations.filter((op) => op.kind !== "insert").map((op) => op.line),
      ).toEqual(before);
      expect(
        operations.filter((op) => op.kind !== "delete").map((op) => op.line),
      ).toEqual(after);
      expect(operations.filter((op) => op.kind === "equal")).toHaveLength(
        lcsLength(before, after),
      );
      for (const [index, operation] of operations.entries()) {
        if (operation.kind === "delete") {
          expect(operations[index - 1]?.kind).not.toBe("insert");
        }
      }
    }
  });

  test("deletes before inserting in a change block, like diff -u", () => {
    expect(
      diffLines(["a", "b"], ["b", "a", "c"]).map(
        ({ kind, line }) => `${kind} ${line}`,
      ),
    ).toEqual(["insert b", "equal a", "delete b", "insert c"]);
  });
});

describe("unifiedDiff", () => {
  test("renders hunks with 3 lines of context", () => {
    const before = "a\nb\nc\nd\ne\nf\ng\nh\ni\nj\n";
    const after = "a\nB\nc\nd\ne\nf\ng\nh\ni\nj\nk\n";
    expect(unifiedDiff(before, after)).toBe(
      [
        "@@ -1,5 +1,5 @@",
        " a",
        "-b",
        "+B",
        " c",
        " d",
        " e",
        "@@ -8,3 +8,4 @@",
        " h",
        " i",
        " j",
        "+k",
      ].join("\n"),
    );
  });

  test("diffs a 70k-line file, too large for a quadratic table", () => {
    const lines = Array.from({ length: 70_000 }, (_, index) => `line ${index}`);
    const afterLines = lines
      .toSpliced(15_000, 1, "changed")
      .toSpliced(20_000, 0, "inserted");
    const diff = unifiedDiff(
      `${lines.join("\n")}\n`,
      `${afterLines.join("\n")}\n`,
    );
    expect(diff).toBe(
      [
        "@@ -14998,7 +14998,7 @@",
        " line 14997",
        " line 14998",
        " line 14999",
        "-line 15000",
        "+changed",
        " line 15001",
        " line 15002",
        " line 15003",
        "@@ -19998,6 +19998,7 @@",
        " line 19997",
        " line 19998",
        " line 19999",
        "+inserted",
        " line 20000",
        " line 20001",
        " line 20002",
      ].join("\n"),
    );
  });

  test("diffs two unrelated 70k-line files", () => {
    const before = Array.from({ length: 70_000 }, (_, index) => `a${index}`);
    const after = Array.from({ length: 70_000 }, (_, index) => `b${index}`);
    const diff = unifiedDiff(before.join("\n"), after.join("\n"));
    const lines = diff.split("\n");
    expect(lines[0]).toBe("@@ -1,70000 +1,70000 @@");
    expect(lines.filter((line) => line.startsWith("-"))).toHaveLength(70_000);
    expect(lines.filter((line) => line.startsWith("+"))).toHaveLength(70_000);
  });
});
