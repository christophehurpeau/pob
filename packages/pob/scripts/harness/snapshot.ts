export type FileStatus = "created" | "modified" | "deleted";

export interface SnapshotFile {
  path: string;
  status: FileStatus;
  content?: string;
}

export interface HarnessResult {
  fixture: string;
  exitCode: number;
  effects: string[];
  removedFromIndex: string[];
  files: SnapshotFile[];
  /**
   * what a second run of the old engine changes on its own output: the old
   * engine sometimes needs two runs to converge
   */
  secondRun: SnapshotFile[];
}

const FILE_MARKER = ">>>>> pob-harness ";
const SECOND_RUN_PREFIX = "second run ";

export const serializeSnapshot = (result: HarnessResult): string => {
  const lines = [
    `# pob harness snapshot: ${result.fixture}`,
    `exit code: ${result.exitCode}`,
    "effects:",
    ...result.effects.map((effect) => `  ${effect}`),
    "removed from git index:",
    ...result.removedFromIndex.map((filePath) => `  ${filePath}`),
    "",
  ];
  const pushFile = (file: SnapshotFile, prefix: string): void => {
    lines.push(`${FILE_MARKER}${prefix}${file.status}: ${file.path}`);
    if (file.content !== undefined) {
      lines.push(
        file.content.endsWith("\n")
          ? file.content.slice(0, -1)
          : `${file.content}\n<<<<< no newline at end of file`,
      );
    }
  };
  for (const file of result.files) pushFile(file, "");
  for (const file of result.secondRun) pushFile(file, SECOND_RUN_PREFIX);
  return `${lines.join("\n")}\n`;
};

const NO_NEWLINE = "\n<<<<< no newline at end of file";

const parseFile = (
  chunk: string,
  newlineIndex: number,
  title: string,
): SnapshotFile => {
  const [status, ...pathParts] = title.split(": ");
  const filePath = pathParts.join(": ");
  if (status === "deleted") {
    return { path: filePath, status: "deleted" };
  }
  const body = newlineIndex === -1 ? "" : chunk.slice(newlineIndex + 1);
  const content = body.endsWith(NO_NEWLINE)
    ? body.slice(0, -NO_NEWLINE.length)
    : `${body.endsWith("\n") ? body.slice(0, -1) : body}\n`;
  return { path: filePath, status: status as FileStatus, content };
};

export const parseSnapshot = (text: string): HarnessResult => {
  const [header = "", ...fileChunks] = text.split(`\n${FILE_MARKER}`);
  const headerLines = header.split("\n");
  const fixture = headerLines[0]?.replace("# pob harness snapshot: ", "") ?? "";
  const exitCode = Number(headerLines[1]?.replace("exit code: ", ""));
  const effectsStart = headerLines.indexOf("effects:");
  const indexStart = headerLines.indexOf("removed from git index:");
  const listAfter = (start: number, end: number): string[] =>
    headerLines
      .slice(start + 1, end)
      .filter((line) => line.startsWith("  "))
      .map((line) => line.slice(2));

  const parsed = fileChunks.map((chunk) => {
    const newlineIndex = chunk.indexOf("\n");
    const fullTitle =
      newlineIndex === -1 ? chunk : chunk.slice(0, newlineIndex);
    const secondRun = fullTitle.startsWith(SECOND_RUN_PREFIX);
    const title = secondRun
      ? fullTitle.slice(SECOND_RUN_PREFIX.length)
      : fullTitle;
    return { secondRun, file: parseFile(chunk, newlineIndex, title) };
  });
  const files = parsed
    .filter((entry) => !entry.secondRun)
    .map(({ file }) => file);
  const secondRun = parsed
    .filter((entry) => entry.secondRun)
    .map(({ file }) => file);

  return {
    fixture,
    exitCode,
    effects: listAfter(effectsStart, indexStart),
    removedFromIndex: listAfter(indexStart, headerLines.length),
    files,
    secondRun,
  };
};

/**
 * The changes of the old engine once converged: its first run, then the
 * changes of its second run.
 */
export const fixedPoint = (
  result: HarnessResult,
  initial: ReadonlyMap<string, string>,
): HarnessResult => {
  const files = new Map(result.files.map((file) => [file.path, file]));
  for (const file of result.secondRun) {
    const initialContent = initial.get(file.path);
    if (file.status === "deleted") {
      if (initialContent === undefined) files.delete(file.path);
      else files.set(file.path, { path: file.path, status: "deleted" });
    } else if (initialContent === file.content) {
      files.delete(file.path);
    } else {
      files.set(file.path, {
        path: file.path,
        status: initialContent === undefined ? "created" : "modified",
        content: file.content,
      });
    }
  }
  return {
    ...result,
    files: [...files.values()].toSorted((a, b) =>
      a.path.localeCompare(b.path, "en"),
    ),
    secondRun: [],
  };
};

const firstDifferentLine = (expected: string, actual: string): string => {
  const expectedLines = expected.split("\n");
  const actualLines = actual.split("\n");
  const length = Math.max(expectedLines.length, actualLines.length);
  for (let index = 0; index < length; index++) {
    if (expectedLines[index] !== actualLines[index]) {
      return `line ${index + 1}: expected ${JSON.stringify(expectedLines[index])}, got ${JSON.stringify(actualLines[index])}`;
    }
  }
  return "same lines";
};

/** Human readable differences between an expected and an actual result. */
export const diffSnapshots = (
  expected: HarnessResult,
  actual: HarnessResult,
): string[] => {
  const differences: string[] = [];
  if (expected.exitCode !== actual.exitCode) {
    differences.push(
      `exit code: expected ${expected.exitCode}, got ${actual.exitCode}`,
    );
  }
  const expectedFiles = new Map(
    expected.files.map((file) => [file.path, file]),
  );
  const actualFiles = new Map(actual.files.map((file) => [file.path, file]));
  for (const [filePath, expectedFile] of expectedFiles) {
    const actualFile = actualFiles.get(filePath);
    if (!actualFile) {
      differences.push(
        `${filePath}: expected ${expectedFile.status}, unchanged`,
      );
    } else if (actualFile.status !== expectedFile.status) {
      differences.push(
        `${filePath}: expected ${expectedFile.status}, got ${actualFile.status}`,
      );
    } else if (actualFile.content !== expectedFile.content) {
      differences.push(
        `${filePath}: content differs, ${firstDifferentLine(expectedFile.content ?? "", actualFile.content ?? "")}`,
      );
    }
  }
  for (const [filePath, actualFile] of actualFiles) {
    if (!expectedFiles.has(filePath)) {
      differences.push(
        `${filePath}: expected unchanged, got ${actualFile.status}`,
      );
    }
  }
  const expectedIndex = expected.removedFromIndex.join(", ");
  const actualIndex = actual.removedFromIndex.join(", ");
  if (expectedIndex !== actualIndex) {
    differences.push(
      `removed from git index: expected [${expectedIndex}], got [${actualIndex}]`,
    );
  }
  return differences;
};
