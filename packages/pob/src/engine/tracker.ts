import { isDeepStrictEqual } from "node:util";
import type { PathSegments } from "./paths.ts";
import {
  filePatternCovers,
  formatPath,
  parsePattern,
  patternCovers,
} from "./paths.ts";

export interface StepDeclaration {
  name: string;
  reads: readonly string[];
  writes: readonly string[];
  overrides: readonly string[];
}

export interface WriteRecord {
  step: string;
  path: PathSegments;
  /** undefined for a removal */
  value: unknown;
  /** the write changed the document: not a removal of an absent key */
  changed: boolean;
}

export class UndeclaredAccessError extends Error {
  constructor(step: string, access: "read" | "write", path: string) {
    super(
      `step "${step}" ${access === "read" ? "reads" : "writes"} "${path}" without declaring it in its ${access === "read" ? "reads or writes" : "writes"}`,
    );
    this.name = "UndeclaredAccessError";
  }
}

/**
 * A read covered only by the step's own writes, of a value another step
 * writes without being ordered with it: the value read would depend on the
 * registration order of the steps.
 */
export class UnorderedReadError extends Error {
  constructor(reader: string, path: string, writer: string) {
    super(
      `step "${reader}" reads "${path}", which step "${writer}" writes: declare it in its reads`,
    );
    this.name = "UnorderedReadError";
  }
}

export class WriteConflictError extends Error {
  constructor(
    step: string,
    path: string,
    other: WriteRecord,
    value: unknown,
    otherValue: unknown,
  ) {
    super(
      `step "${step}" sets "${path}" to ${JSON.stringify(value) ?? "nothing (removed)"} but step "${other.step}" sets it to ${JSON.stringify(otherValue) ?? "nothing (removed)"}: declare overrides: ["${other.step}"] if this is intended`,
    );
    this.name = "WriteConflictError";
  }
}

const SEPARATOR = "\0";
const pathKey = (path: PathSegments): string => path.join(SEPARATOR);

export const getAtPath = (value: unknown, path: PathSegments): unknown => {
  let current = value;
  for (const segment of path) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
};

const isPrefix = (prefix: PathSegments, path: PathSegments): boolean =>
  prefix.length <= path.length &&
  prefix.every((segment, index) => segment === path[index]);

/**
 * Checks the accesses of the running step against its declarations, and
 * records every write with the step that made it.
 */
export interface Tracker {
  /** throw on undeclared accesses: on in tests and in the harness */
  readonly strict: boolean;
  readonly current: StepDeclaration | undefined;
  runAs: <T>(step: StepDeclaration | undefined, fn: () => T) => T;
  runAsAsync: <T>(
    step: StepDeclaration | undefined,
    fn: () => Promise<T>,
  ) => Promise<T>;
  checkRead: (path: PathSegments) => void;
  checkWrite: (path: PathSegments) => void;
  checkFileWrite: (filePath: string) => void;
  /**
   * @param changed false when the write leaves the document as it is (a
   *   removal of an absent key): it cannot change what another step reads
   */
  record: (path: PathSegments, value: unknown, changed?: boolean) => void;
  /**
   * Whether the step `before` always runs before `after`, by the declared
   * edges: reads covered only by the step's own writes are checked with it.
   */
  setStepOrder: (isOrdered: (before: string, after: string) => boolean) => void;
  recordsFor: (path: PathSegments) => WriteRecord[];
  allRecords: () => WriteRecord[];
}

const isCovered = (patterns: readonly string[], path: PathSegments): boolean =>
  patterns.some((pattern) => patternCovers(parsePattern(pattern), path));

/** `value` with the value at `path` replaced, undefined removing it */
const withValueAt = (
  value: unknown,
  path: PathSegments,
  replacement: unknown,
): unknown => {
  const [segment, ...rest] = path;
  if (segment === undefined) return structuredClone(replacement);
  const container: Record<string, unknown> =
    value !== null && typeof value === "object" && !Array.isArray(value)
      ? { ...(value as Record<string, unknown>) }
      : {};
  const next = withValueAt(container[segment], rest, replacement);
  if (next === undefined) Reflect.deleteProperty(container, segment);
  else container[segment] = next;
  return container;
};

const overlaps = (a: PathSegments, b: PathSegments): boolean =>
  isPrefix(a, b) || isPrefix(b, a);

export const createTracker = ({ strict }: { strict: boolean }): Tracker => {
  let current: StepDeclaration | undefined;
  const records = new Map<string, WriteRecord[]>();
  let isOrdered = (_before: string, _after: string): boolean => false;
  /** reads covered only by the own writes of their step */
  const selfReads: { step: string; path: PathSegments }[] = [];
  /**
   * What the writes of a step still set once the steps overriding it wrote:
   * conflicts are checked against this effective value. A record entirely
   * replaced by an override is absent from the conflict checks.
   */
  const effectiveValues = new Map<WriteRecord, unknown>();
  const superseded = new Set<WriteRecord>();

  const effectiveValue = (record: WriteRecord): unknown =>
    effectiveValues.has(record) ? effectiveValues.get(record) : record.value;

  const checkConflicts = (path: PathSegments, value: unknown): void => {
    if (!current) return;
    const step = current;
    for (const recordList of records.values()) {
      for (const record of recordList) {
        if (record.step === step.name) continue;
        if (superseded.has(record)) continue;
        if (step.overrides.includes(record.step)) continue;
        let ownValue: unknown;
        let otherValue: unknown;
        if (isPrefix(path, record.path)) {
          ownValue = getAtPath(value, record.path.slice(path.length));
          otherValue = effectiveValue(record);
        } else if (isPrefix(record.path, path)) {
          ownValue = value;
          otherValue = getAtPath(
            effectiveValue(record),
            path.slice(record.path.length),
          );
        } else {
          continue;
        }
        if (!isDeepStrictEqual(ownValue, otherValue)) {
          throw new WriteConflictError(
            step.name,
            formatPath(path),
            record,
            ownValue,
            otherValue,
          );
        }
      }
    }
  };

  /** the overridden writes now set what the overriding step set */
  const applyOverrides = (path: PathSegments, value: unknown): void => {
    if (!current || current.overrides.length === 0) return;
    const { overrides } = current;
    for (const recordList of records.values()) {
      for (const record of recordList) {
        if (!overrides.includes(record.step) || superseded.has(record)) {
          continue;
        }
        if (isPrefix(path, record.path)) {
          superseded.add(record);
        } else if (isPrefix(record.path, path)) {
          effectiveValues.set(
            record,
            withValueAt(
              effectiveValue(record),
              path.slice(record.path.length),
              value,
            ),
          );
        }
      }
    }
  };

  return {
    strict,
    get current() {
      return current;
    },
    runAs: (step, fn) => {
      const previous = current;
      current = step;
      try {
        return fn();
      } finally {
        current = previous;
      }
    },
    runAsAsync: async (step, fn) => {
      const previous = current;
      current = step;
      try {
        return await fn();
      } finally {
        current = previous;
      }
    },
    checkRead: (path) => {
      if (!strict || !current) return;
      if (isCovered(current.reads, path)) return;
      if (!isCovered(current.writes, path)) {
        throw new UndeclaredAccessError(current.name, "read", formatPath(path));
      }
      // covered only by its own writes: no step that writes it may run
      // before this one without an ordering edge
      for (const recordList of records.values()) {
        for (const record of recordList) {
          if (
            record.changed &&
            record.step !== current.name &&
            record.step !== "engine" &&
            overlaps(record.path, path) &&
            !isOrdered(record.step, current.name)
          ) {
            throw new UnorderedReadError(
              current.name,
              formatPath(path),
              record.step,
            );
          }
        }
      }
      selfReads.push({ step: current.name, path });
    },
    checkWrite: (path) => {
      if (!strict || !current) return;
      if (!isCovered(current.writes, path)) {
        throw new UndeclaredAccessError(
          current.name,
          "write",
          formatPath(path),
        );
      }
    },
    checkFileWrite: (filePath) => {
      if (!strict || !current) return;
      const covered = current.writes.some(
        (pattern) =>
          pattern.startsWith("files:") && filePatternCovers(pattern, filePath),
      );
      if (!covered) {
        throw new UndeclaredAccessError(
          current.name,
          "write",
          `files:${filePath}`,
        );
      }
    },
    record: (path, value, changed = true) => {
      if (strict && current && changed) {
        // nor run after it without an ordering edge
        for (const read of selfReads) {
          if (
            read.step !== current.name &&
            overlaps(read.path, path) &&
            !isOrdered(read.step, current.name)
          ) {
            throw new UnorderedReadError(
              read.step,
              formatPath(read.path),
              current.name,
            );
          }
        }
      }
      checkConflicts(path, value);
      applyOverrides(path, value);
      const key = pathKey(path);
      const list = records.get(key) ?? [];
      list.push({
        step: current?.name ?? "engine",
        path,
        value: structuredClone(value),
        changed,
      });
      records.set(key, list);
    },
    setStepOrder: (ordered) => {
      isOrdered = ordered;
    },
    recordsFor: (path) => records.get(pathKey(path)) ?? [],
    allRecords: () => [...records.values()].flat(),
  };
};
