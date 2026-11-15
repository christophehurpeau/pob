export interface Operation {
  kind: "equal" | "delete" | "insert";
  line: string;
}

const splitLines = (content: string): string[] => {
  if (content === "") return [];
  const lines = content.split("\n");
  if (lines.at(-1) === "") lines.pop();
  return lines;
};

/**
 * Above this many steps of the Myers search, `(lines) * (edits)`, a range is
 * rendered as deleted then inserted instead of a minimal diff: unrelated large
 * files would otherwise take seconds.
 */
const SEARCH_BUDGET = 50_000_000;
const MIN_EDIT_BUDGET = 256;

interface Range {
  before: readonly string[];
  after: readonly string[];
  beforeStart: number;
  beforeEnd: number;
  afterStart: number;
  afterEnd: number;
}

const replaceAll = (range: Range, operations: Operation[]): void => {
  for (let i = range.beforeStart; i < range.beforeEnd; i++) {
    operations.push({ kind: "delete", line: range.before[i] ?? "" });
  }
  for (let j = range.afterStart; j < range.afterEnd; j++) {
    operations.push({ kind: "insert", line: range.after[j] ?? "" });
  }
};

/**
 * A point on a minimal edit path between the two (prefix and suffix trimmed,
 * non-empty) ranges, from the middle snake of the Myers algorithm in linear
 * space. Undefined when the search exceeds its budget.
 */
const findSplit = (
  range: Range,
): { beforeIndex: number; afterIndex: number } | undefined => {
  const { before, after, beforeStart, afterStart } = range;
  const beforeLength = range.beforeEnd - beforeStart;
  const afterLength = range.afterEnd - afterStart;
  const maxEdits = Math.ceil((beforeLength + afterLength) / 2);
  const editBudget = Math.max(
    MIN_EDIT_BUDGET,
    Math.floor(SEARCH_BUDGET / (beforeLength + afterLength)),
  );
  const offset = maxEdits;
  const size = 2 * maxEdits + 2;
  /** furthest x reached on each diagonal, from the start and from the end */
  const forward = new Int32Array(size).fill(-1);
  const backward = new Int32Array(size).fill(-1);
  forward[offset + 1] = 0;
  backward[offset + 1] = 0;
  const delta = beforeLength - afterLength;
  const forwardChecksOverlap = delta % 2 !== 0;
  let forwardStart = 0;
  let forwardEnd = 0;
  let backwardStart = 0;
  let backwardEnd = 0;
  const at = (array: Int32Array, index: number): number => array[index] ?? -1;

  for (let d = 0; d < Math.min(maxEdits, editBudget); d++) {
    for (let k = -d + forwardStart; k <= d - forwardEnd; k += 2) {
      const index = offset + k;
      let x =
        k === -d || (k !== d && at(forward, index - 1) < at(forward, index + 1))
          ? at(forward, index + 1)
          : at(forward, index - 1) + 1;
      let y = x - k;
      while (
        x < beforeLength &&
        y < afterLength &&
        before[beforeStart + x] === after[afterStart + y]
      ) {
        x++;
        y++;
      }
      forward[index] = x;
      if (x > beforeLength) forwardEnd += 2;
      else if (y > afterLength) forwardStart += 2;
      else if (forwardChecksOverlap) {
        const backwardIndex = offset + delta - k;
        if (
          backwardIndex >= 0 &&
          backwardIndex < size &&
          at(backward, backwardIndex) !== -1 &&
          x >= beforeLength - at(backward, backwardIndex)
        ) {
          return { beforeIndex: beforeStart + x, afterIndex: afterStart + y };
        }
      }
    }
    for (let k = -d + backwardStart; k <= d - backwardEnd; k += 2) {
      const index = offset + k;
      let x =
        k === -d ||
        (k !== d && at(backward, index - 1) < at(backward, index + 1))
          ? at(backward, index + 1)
          : at(backward, index - 1) + 1;
      let y = x - k;
      while (
        x < beforeLength &&
        y < afterLength &&
        before[range.beforeEnd - x - 1] === after[range.afterEnd - y - 1]
      ) {
        x++;
        y++;
      }
      backward[index] = x;
      if (x > beforeLength) backwardEnd += 2;
      else if (y > afterLength) backwardStart += 2;
      else if (!forwardChecksOverlap) {
        const forwardIndex = offset + delta - k;
        if (
          forwardIndex >= 0 &&
          forwardIndex < size &&
          at(forward, forwardIndex) !== -1
        ) {
          const forwardX = at(forward, forwardIndex);
          const forwardY = offset + forwardX - forwardIndex;
          if (forwardX >= beforeLength - x) {
            return {
              beforeIndex: beforeStart + forwardX,
              afterIndex: afterStart + forwardY,
            };
          }
        }
      }
    }
  }
  return undefined;
};

const diffRange = (range: Range, operations: Operation[]): void => {
  const { before, after } = range;
  let { beforeStart, beforeEnd, afterStart, afterEnd } = range;
  while (
    beforeStart < beforeEnd &&
    afterStart < afterEnd &&
    before[beforeStart] === after[afterStart]
  ) {
    operations.push({ kind: "equal", line: before[beforeStart] ?? "" });
    beforeStart++;
    afterStart++;
  }
  let suffixLength = 0;
  while (
    beforeStart < beforeEnd - suffixLength &&
    afterStart < afterEnd - suffixLength &&
    before[beforeEnd - suffixLength - 1] === after[afterEnd - suffixLength - 1]
  ) {
    suffixLength++;
  }
  beforeEnd -= suffixLength;
  afterEnd -= suffixLength;
  const middle = {
    before,
    after,
    beforeStart,
    beforeEnd,
    afterStart,
    afterEnd,
  };
  const split =
    beforeStart < beforeEnd && afterStart < afterEnd
      ? findSplit(middle)
      : undefined;
  if (split) {
    diffRange(
      { ...middle, beforeEnd: split.beforeIndex, afterEnd: split.afterIndex },
      operations,
    );
    diffRange(
      {
        ...middle,
        beforeStart: split.beforeIndex,
        afterStart: split.afterIndex,
      },
      operations,
    );
  } else {
    replaceAll(middle, operations);
  }
  for (let i = beforeEnd; i < beforeEnd + suffixLength; i++) {
    operations.push({ kind: "equal", line: before[i] ?? "" });
  }
};

/**
 * The halves of a split can meet with an insertion before a deletion: each
 * block of changes is ordered deletions first, like diff -u and git.
 */
const deletionsFirst = (operations: readonly Operation[]): Operation[] => {
  const ordered: Operation[] = [];
  let insertions: Operation[] = [];
  for (const operation of operations) {
    if (operation.kind === "insert") {
      insertions.push(operation);
      continue;
    }
    if (operation.kind === "equal") {
      ordered.push(...insertions);
      insertions = [];
    }
    ordered.push(operation);
  }
  ordered.push(...insertions);
  return ordered;
};

/** Line operations of a minimal diff (Myers, linear space). */
export const diffLines = (
  before: readonly string[],
  after: readonly string[],
): Operation[] => {
  const operations: Operation[] = [];
  diffRange(
    {
      before,
      after,
      beforeStart: 0,
      beforeEnd: before.length,
      afterStart: 0,
      afterEnd: after.length,
    },
    operations,
  );
  return deletionsFirst(operations);
};

/** Number of removed and added lines between two file contents. */
export const diffStats = (
  before: string,
  after: string,
): { removed: number; added: number } => {
  const operations = diffLines(splitLines(before), splitLines(after));
  return {
    removed: operations.filter((op) => op.kind === "delete").length,
    added: operations.filter((op) => op.kind === "insert").length,
  };
};

const CONTEXT = 3;

/** Unified diff of two file contents, without the file header. */
export const unifiedDiff = (before: string, after: string): string => {
  const operations = diffLines(splitLines(before), splitLines(after));
  const changed = operations
    .map((operation, index) => (operation.kind === "equal" ? -1 : index))
    .filter((index) => index !== -1);
  if (changed.length === 0) return "";

  const hunks: [number, number][] = [];
  for (const index of changed) {
    const start = Math.max(0, index - CONTEXT);
    const end = Math.min(operations.length, index + CONTEXT + 1);
    const last = hunks.at(-1);
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else hunks.push([start, end]);
  }

  const output: string[] = [];
  let beforeLine = 1;
  let afterLine = 1;
  let position = 0;
  for (const [start, end] of hunks) {
    for (; position < start; position++) {
      const kind = operations[position]?.kind;
      if (kind !== "insert") beforeLine++;
      if (kind !== "delete") afterLine++;
    }
    const hunk = operations.slice(start, end);
    const beforeCount = hunk.filter((op) => op.kind !== "insert").length;
    const afterCount = hunk.filter((op) => op.kind !== "delete").length;
    output.push(
      `@@ -${beforeLine},${beforeCount} +${afterLine},${afterCount} @@`,
    );
    for (const operation of hunk) {
      if (operation.kind === "equal") output.push(` ${operation.line}`);
      else {
        output.push(
          `${operation.kind === "delete" ? "-" : "+"}${operation.line}`,
        );
      }
    }
  }
  return output.join("\n");
};
