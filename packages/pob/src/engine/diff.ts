interface Operation {
  kind: "equal" | "delete" | "insert";
  line: string;
}

const splitLines = (content: string): string[] => {
  if (content === "") return [];
  const lines = content.split("\n");
  if (lines.at(-1) === "") lines.pop();
  return lines;
};

/** Line operations from a longest common subsequence. */
const diffLines = (before: string[], after: string[]): Operation[] => {
  const rows = before.length + 1;
  const columns = after.length + 1;
  const lengths = new Uint32Array(rows * columns);
  for (let i = before.length - 1; i >= 0; i--) {
    for (let j = after.length - 1; j >= 0; j--) {
      lengths[i * columns + j] =
        before[i] === after[j]
          ? (lengths[(i + 1) * columns + j + 1] ?? 0) + 1
          : Math.max(
              lengths[(i + 1) * columns + j] ?? 0,
              lengths[i * columns + j + 1] ?? 0,
            );
    }
  }
  const operations: Operation[] = [];
  let i = 0;
  let j = 0;
  while (i < before.length && j < after.length) {
    if (before[i] === after[j]) {
      operations.push({ kind: "equal", line: before[i] ?? "" });
      i++;
      j++;
    } else if (
      (lengths[(i + 1) * columns + j] ?? 0) >=
      (lengths[i * columns + j + 1] ?? 0)
    ) {
      operations.push({ kind: "delete", line: before[i] ?? "" });
      i++;
    } else {
      operations.push({ kind: "insert", line: after[j] ?? "" });
      j++;
    }
  }
  for (; i < before.length; i++) {
    operations.push({ kind: "delete", line: before[i] ?? "" });
  }
  for (; j < after.length; j++) {
    operations.push({ kind: "insert", line: after[j] ?? "" });
  }
  return operations;
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
  for (const [start, end] of hunks) {
    let beforeLine = 1;
    let afterLine = 1;
    for (const operation of operations.slice(0, start)) {
      if (operation.kind !== "insert") beforeLine++;
      if (operation.kind !== "delete") afterLine++;
    }
    const hunk = operations.slice(start, end);
    const beforeCount = hunk.filter((op) => op.kind !== "insert").length;
    const afterCount = hunk.filter((op) => op.kind !== "delete").length;
    output.push(
      `@@ -${beforeLine},${beforeCount} +${afterLine},${afterCount} @@`,
      ...hunk.map((operation) => {
        if (operation.kind === "equal") return ` ${operation.line}`;
        return `${operation.kind === "delete" ? "-" : "+"}${operation.line}`;
      }),
    );
  }
  return output.join("\n");
};
