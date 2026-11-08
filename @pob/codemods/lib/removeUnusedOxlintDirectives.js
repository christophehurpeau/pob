import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

/**
 * @typedef {{ offset: number; length: number }} Span
 * A span reported by oxlint, in utf-8 bytes: the whole directive comment when
 * none of its rules is used, else one unused rule name of its list.
 */

const UNUSED_DIRECTIVE_MESSAGE = "Unused oxlint-disable directive";

const DIRECTIVE_KEYWORD_REGEXP = /^\s*oxlint-disable(?:-next-line|-line)?\s/;

/**
 * Splits `// oxlint-disable-next-line a, b -- reason` (or its block form) into
 * the rule names and the text around them.
 *
 * @param {string} comment
 */
const parseDirective = (comment) => {
  const isBlock = comment.startsWith("/*");
  const body = isBlock ? comment.slice(2, -2) : comment.slice(2);
  const keyword = DIRECTIVE_KEYWORD_REGEXP.exec(body);
  if (!keyword) throw new Error(`Unexpected directive: ${comment}`);
  const afterKeyword = body.slice(keyword[0].length);
  const descriptionIndex = afterKeyword.indexOf(" --");
  const rulesAndSpaces =
    descriptionIndex === -1
      ? afterKeyword
      : afterKeyword.slice(0, descriptionIndex);
  const rulesText = rulesAndSpaces.trimEnd();
  return {
    prefix: comment.slice(0, 2) + keyword[0],
    rules: rulesText.split(",").map((rule) => rule.trim()),
    suffix:
      rulesAndSpaces.slice(rulesText.length) +
      (descriptionIndex === -1 ? "" : afterKeyword.slice(descriptionIndex)) +
      (isBlock ? "*/" : ""),
  };
};

/**
 * @param {string} source
 * @param {number} start
 * @param {number} end
 */
const removeComment = (source, start, end) => {
  const lineStart = source.lastIndexOf("\n", start - 1) + 1;
  const newLineIndex = source.indexOf("\n", end);
  const lineEnd = newLineIndex === -1 ? source.length : newLineIndex;
  const isAloneOnItsLine =
    source.slice(lineStart, start).trim() === "" &&
    source.slice(end, lineEnd).trim() === "";
  if (isAloneOnItsLine) {
    return source.slice(0, lineStart) + source.slice(lineEnd + 1);
  }
  return source.slice(0, start).replace(/[\t ]+$/, "") + source.slice(end);
};

/**
 * @param {string} source
 * @param {number} offset
 */
const findEnclosingComment = (source, offset) => {
  const start = Math.max(
    source.lastIndexOf("//", offset),
    source.lastIndexOf("/*", offset),
  );
  if (source.startsWith("/*", start)) {
    return { start, end: source.indexOf("*/", offset) + 2 };
  }
  const newLineIndex = source.indexOf("\n", offset);
  return { start, end: newLineIndex === -1 ? source.length : newLineIndex };
};

/**
 * Removes the directives, or the rule names inside a directive, that oxlint
 * reported as unused.
 *
 * @param {string} source
 * @param {Span[]} spans
 * @returns {string}
 */
export const removeUnusedOxlintDirectives = (source, spans) => {
  const buffer = Buffer.from(source, "utf8");
  /** @param {number} byteOffset */
  const toCharOffset = (byteOffset) =>
    buffer.subarray(0, byteOffset).toString("utf8").length;

  /** @type {Map<number, { start: number; end: number; unusedRules?: string[] }>} */
  const editsByStart = new Map();
  for (const span of spans) {
    const start = toCharOffset(span.offset);
    const end = toCharOffset(span.offset + span.length);
    const text = source.slice(start, end);
    if (text.startsWith("//") || text.startsWith("/*")) {
      editsByStart.set(start, { start, end });
      continue;
    }
    const comment = findEnclosingComment(source, start);
    const edit = editsByStart.get(comment.start) ?? {
      ...comment,
      unusedRules: [],
    };
    edit.unusedRules?.push(text);
    editsByStart.set(comment.start, edit);
  }

  let result = source;
  // from the end, so that the offsets of the previous edits stay valid
  const edits = [...editsByStart.values()].toSorted(
    (a, b) => b.start - a.start,
  );
  for (const { start, end, unusedRules } of edits) {
    if (!unusedRules) {
      result = removeComment(result, start, end);
      continue;
    }
    const comment = result.slice(start, end);
    const { prefix, rules, suffix } = parseDirective(comment);
    const remainingRules = rules.filter((rule) => !unusedRules.includes(rule));
    if (rules.length - remainingRules.length !== unusedRules.length) {
      throw new Error(
        `Unused rules ${unusedRules.join(", ")} not found in: ${comment}`,
      );
    }
    result =
      remainingRules.length === 0
        ? removeComment(result, start, end)
        : result.slice(0, start) +
          prefix +
          remainingRules.join(", ") +
          suffix +
          result.slice(end);
  }
  return result;
};

/**
 * Runs the oxlint of the project in `cwd` and removes the directives it
 * reports as unused. Generated files belong in the `ignorePatterns` of
 * `.oxlintrc.json`, or their directives are removed too.
 *
 * @param {{ cwd?: string; args?: string[] }} [options] `args` are passed to
 * oxlint, for example the paths to lint.
 * @returns {string[]} the modified files
 */
export const runRemoveUnusedOxlintDirectives = ({
  cwd = process.cwd(),
  args = [],
} = {}) => {
  const require = createRequire(path.join(cwd, "package.json"));
  const oxlintBin = path.join(
    path.dirname(require.resolve("oxlint/package.json")),
    "bin/oxlint",
  );
  const { stdout, stderr, error } = spawnSync(
    process.execPath,
    [oxlintBin, "--quiet", "--format", "json", ...args],
    { cwd, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 },
  );
  if (error) throw error;

  /** @type {{ diagnostics: { message: string; filename: string; labels: { span: Span }[] }[] }} */
  let report;
  try {
    report = JSON.parse(stdout);
  } catch {
    throw new Error(`oxlint did not output json:\n${stdout}\n${stderr}`);
  }

  /** @type {Map<string, Span[]>} */
  const spansByFile = new Map();
  for (const { message, filename, labels } of report.diagnostics) {
    if (!message.startsWith(UNUSED_DIRECTIVE_MESSAGE)) continue;
    const spans = spansByFile.get(filename) ?? [];
    spans.push(labels[0].span);
    spansByFile.set(filename, spans);
  }

  for (const [filename, spans] of spansByFile) {
    const filePath = path.resolve(cwd, filename);
    writeFileSync(
      filePath,
      removeUnusedOxlintDirectives(readFileSync(filePath, "utf8"), spans),
    );
  }
  return [...spansByFile.keys()];
};
