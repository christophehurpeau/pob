/**
 * Paths of tracked values: `<model>.<key>.<key>`, for example
 * `pkg.scripts.lint`. Files are `files:<path>`, for example
 * `files:.github/workflows/push.yml`.
 *
 * A pattern covers a path when its segments are a prefix of the path's
 * segments. `*` matches any single segment: `pkg.scripts` covers every script,
 * `*.extends` covers the `extends` key of every model.
 */

import path from "node:path";

export type PathSegments = readonly string[];

/**
 * A file path of a package, relative to it and normalized (posix, without
 * `.` and `..` segments): the path planned and the path applied. Undefined
 * for the package directory itself and for a path outside of it.
 */
export const normalizePackagePath = (filePath: string): string | undefined => {
  if (path.posix.isAbsolute(filePath) || path.win32.isAbsolute(filePath)) {
    return undefined;
  }
  const normalized = path.posix
    .normalize(filePath.replaceAll("\\", "/"))
    .replace(/\/$/, "");
  if (
    normalized === "." ||
    normalized === ".." ||
    normalized.startsWith("../")
  ) {
    return undefined;
  }
  return normalized;
};

/** The absolute path of a file of the plan, which must be inside root. */
export const resolveInside = (root: string, filePath: string): string => {
  const absolutePath = path.resolve(root, filePath);
  const relative = path.relative(root, absolutePath);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`${filePath} is outside ${root}`);
  }
  return absolutePath;
};

const FILES_PREFIX = "files:";

export const isFilePattern = (pattern: string): boolean =>
  pattern.startsWith(FILES_PREFIX);

export const parsePattern = (pattern: string): PathSegments =>
  isFilePattern(pattern) ? [pattern] : pattern.split(".");

export const formatPath = (segments: PathSegments): string =>
  segments.join(".");

const segmentMatches = (patternSegment: string, segment: string): boolean =>
  patternSegment === "*" || patternSegment === segment;

const globToRegExp = (glob: string): RegExp =>
  new RegExp(
    `^${glob
      .replaceAll(/[$()+.?[\\\]^{|}]/g, String.raw`\$&`)
      .replaceAll("**", "\0")
      .replaceAll("*", "[^/]*")
      .replaceAll("\0", ".*")}$`,
  );

/** Whether a `files:` pattern (with `*` and `**` globs) covers a file path. */
export const filePatternCovers = (pattern: string, filePath: string): boolean =>
  globToRegExp(pattern.slice(FILES_PREFIX.length)).test(filePath);

export const patternCovers = (
  pattern: PathSegments,
  path: PathSegments,
): boolean => {
  if (pattern.length > path.length) return false;
  return pattern.every((segment, index) =>
    segmentMatches(segment, path[index] ?? ""),
  );
};

/**
 * Whether two patterns can designate the same value: one is a prefix of the
 * other.
 */
export const patternsOverlap = (a: string, b: string): boolean => {
  if (isFilePattern(a) || isFilePattern(b)) {
    if (!isFilePattern(a) || !isFilePattern(b)) return false;
    const aGlob = a.slice(FILES_PREFIX.length);
    const bGlob = b.slice(FILES_PREFIX.length);
    return (
      filePatternCovers(a, bGlob) ||
      filePatternCovers(b, aGlob) ||
      aGlob === bGlob
    );
  }
  const aSegments = parsePattern(a);
  const bSegments = parsePattern(b);
  const length = Math.min(aSegments.length, bSegments.length);
  for (let index = 0; index < length; index++) {
    const aSegment = aSegments[index] ?? "";
    const bSegment = bSegments[index] ?? "";
    if (aSegment !== "*" && bSegment !== "*" && aSegment !== bSegment) {
      return false;
    }
  }
  return true;
};
