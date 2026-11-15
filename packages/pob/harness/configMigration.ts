/**
 * The config moves from .yo-rc.json, .pob.json and package.json#pob to
 * pob.json: a deliberate difference with the old engine. These files are
 * compared apart: pob.json must hold the config the old engine left, resolved
 * like the new engine reads it.
 */
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { format } from "oxfmt";
import type { RawConfigSources } from "../src/engine/config.ts";
import { resolveConfig } from "../src/engine/config.ts";
import type { HarnessResult, SnapshotFile } from "./snapshot.ts";

const configFiles = new Set([".yo-rc.json", ".pob.json", "pob.json"]);

const isConfigFile = (filePath: string): boolean =>
  configFiles.has(path.posix.basename(filePath));

type Json = Record<string, unknown>;

const parse = (content: string | undefined): Json | undefined =>
  content === undefined ? undefined : (JSON.parse(content) as Json);

/** The tree after the changes of a result. */
export const applyResult = (
  initial: ReadonlyMap<string, string>,
  result: HarnessResult,
): Map<string, string> => {
  const tree = new Map(initial);
  for (const file of result.files) {
    if (file.status === "deleted") tree.delete(file.path);
    else tree.set(file.path, file.content ?? "");
  }
  return tree;
};

const withoutPkgPob = async (file: SnapshotFile): Promise<SnapshotFile> => {
  if (path.posix.basename(file.path) !== "package.json" || !file.content) {
    return file;
  }
  const { pob: _, ...pkg } = parse(file.content) ?? {};
  const { code } = await format(file.path, JSON.stringify(pkg, null, 2), {
    printWidth: 80,
  });
  return { ...file, content: code };
};

/**
 * Removes the config files and package.json#pob from the expected (old) result,
 * and the config files from the actual one.
 */
export const normalizeConfigMigration = async (
  result: HarnessResult,
  initial: ReadonlyMap<string, string>,
): Promise<HarnessResult> => {
  const files: SnapshotFile[] = [];
  for (const file of result.files) {
    if (isConfigFile(file.path)) continue;
    const normalized = await withoutPkgPob(file);
    const initialContent = initial.get(file.path);
    const initialNormalized =
      initialContent === undefined
        ? undefined
        : await withoutPkgPob({
            path: file.path,
            status: "modified",
            content: initialContent,
          });
    const initialWithoutPob = initialNormalized?.content;
    // package.json only changed by the removal of pob
    if (
      normalized.content !== undefined &&
      normalized.content === initialWithoutPob &&
      initialContent !== initialWithoutPob
    ) {
      continue;
    }
    files.push(normalized);
  }
  return { ...result, files };
};

/**
 * Differences between the pob.json files of the new engine and the config the
 * old engine left (.yo-rc.json and package.json#pob of its fixed point).
 */
export const comparePobJson = (
  expectedTree: ReadonlyMap<string, string>,
  actualTree: ReadonlyMap<string, string>,
): string[] => {
  const differences: string[] = [];
  const packageDirectories = [...expectedTree.keys()]
    .filter((filePath) => path.posix.basename(filePath) === "package.json")
    .map((filePath) => path.posix.dirname(filePath))
    .filter(
      (directory) =>
        expectedTree.has(path.posix.join(directory, ".yo-rc.json")) ||
        actualTree.has(path.posix.join(directory, "pob.json")),
    );
  for (const directory of packageDirectories) {
    const join = (file: string): string => path.posix.join(directory, file);
    const sources: RawConfigSources = {
      yoRc: parse(expectedTree.get(join(".yo-rc.json")))?.pob as
        | Json
        | undefined,
      legacyPobJson: parse(expectedTree.get(join(".pob.json"))),
      pkgPob: parse(expectedTree.get(join("package.json")))?.pob as
        | Json
        | undefined,
    };
    const expected = resolveConfig(sources, { isRoot: false })
      .config as unknown as Json;
    const { $schema: _, ...actual } =
      parse(actualTree.get(join("pob.json"))) ?? {};
    if (parse(actualTree.get(join(".yo-rc.json")))?.pob) {
      differences.push(`${join(".yo-rc.json")}: not removed`);
    }
    for (const key of new Set([
      ...Object.keys(expected),
      ...Object.keys(actual),
    ])) {
      // an empty build config is not written
      const isEmpty = (value: unknown): boolean =>
        value === undefined ||
        (typeof value === "object" &&
          value !== null &&
          Object.keys(value).length === 0);
      if (key === "build" && isEmpty(expected[key]) && isEmpty(actual[key])) {
        continue;
      }
      if (!isDeepStrictEqual(expected[key], actual[key])) {
        differences.push(
          `${join("pob.json")}#${key}: expected ${JSON.stringify(expected[key])}, got ${JSON.stringify(actual[key])}`,
        );
      }
    }
  }
  return differences;
};
