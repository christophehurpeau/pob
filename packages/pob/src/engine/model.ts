import { isDeepStrictEqual } from "node:util";
import type { PathSegments } from "./paths.ts";
import type { Tracker } from "./tracker.ts";
import { getAtPath } from "./tracker.ts";

export type JsonObject = Record<string, unknown>;

export type PathInput = string | PathSegments;

const toSegments = (path: PathInput): PathSegments =>
  typeof path === "string" ? path.split(".") : path;

const isObject = (value: unknown): value is JsonObject =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/**
 * A JSON document computed by the steps: every read and write is checked
 * against the declarations of the running step and recorded with it.
 */
export interface TrackedJson {
  readonly name: string;
  get: <T = unknown>(path: PathInput) => T | undefined;
  /**
   * Read without access check, creating no ordering edge: only for the model
   * of another package after its steps ran, or for display (explain). A step
   * reading its own models uses `get`.
   */
  peek: <T = unknown>(path: PathInput) => T | undefined;
  has: (path: PathInput) => boolean;
  set: (path: PathInput, value: unknown) => void;
  delete: (path: PathInput) => void;
  /**
   * Write a value computed from contributions recorded separately (script
   * chains): the write is checked but not recorded.
   */
  writeComputed: (path: PathInput, value: unknown) => void;
  /** current document, without access checks: for rendering */
  snapshot: () => JsonObject;
  /** the value before the steps ran */
  initialValue: (path: PathInput) => unknown;
  /** whether a step wrote anything in it */
  readonly touched: boolean;
}

/**
 * @param name model name, the first segment of its paths (`pkg`)
 * @param initial current content of the file, kept unless a step changes it
 */
export const createTrackedJson = (
  name: string,
  initial: JsonObject,
  tracker: Tracker,
): TrackedJson => {
  const data: JsonObject = structuredClone(initial);
  /** containers emptied by a removal: deleted when rendering */
  const emptiedContainers = new Set<string>();
  let touched = false;

  const fullPath = (segments: PathSegments): PathSegments => [
    name,
    ...segments,
  ];

  const writeValue = (segments: PathSegments, value: unknown): void => {
    touched = true;
    let container: JsonObject = data;
    for (const segment of segments.slice(0, -1)) {
      const next = container[segment];
      if (!isObject(next)) {
        container[segment] = {};
      }
      container = container[segment] as JsonObject;
    }
    const last = segments.at(-1);
    if (last === undefined) throw new Error("set: empty path");
    container[last] = structuredClone(value);
  };

  const pruneEmptiedContainers = (document: JsonObject): JsonObject => {
    for (const key of emptiedContainers) {
      const segments = key.split("\0");
      const parent = getAtPath(document, segments.slice(0, -1));
      const last = segments.at(-1);
      if (!isObject(parent) || last === undefined) continue;
      const value = parent[last];
      if (isObject(value) && Object.keys(value).length === 0) {
        Reflect.deleteProperty(parent, last);
      }
    }
    return document;
  };

  return {
    name,
    get touched() {
      return touched;
    },
    get: <T>(path: PathInput) => {
      const segments = toSegments(path);
      tracker.checkRead(fullPath(segments));
      const value = getAtPath(data, segments);
      return (value === undefined ? undefined : structuredClone(value)) as
        | T
        | undefined;
    },
    peek: <T>(path: PathInput) => {
      const value = getAtPath(data, toSegments(path));
      return (value === undefined ? undefined : structuredClone(value)) as
        | T
        | undefined;
    },
    has: (path) => {
      const segments = toSegments(path);
      tracker.checkRead(fullPath(segments));
      return getAtPath(data, segments) !== undefined;
    },
    set: (path, value) => {
      const segments = toSegments(path);
      tracker.checkWrite(fullPath(segments));
      tracker.record(
        fullPath(segments),
        value,
        !isDeepStrictEqual(getAtPath(data, segments), value),
      );
      writeValue(segments, value);
    },
    writeComputed: (path, value) => {
      const segments = toSegments(path);
      tracker.checkWrite(fullPath(segments));
      writeValue(segments, value);
    },
    delete: (path) => {
      const segments = toSegments(path);
      tracker.checkWrite(fullPath(segments));
      const parent = getAtPath(data, segments.slice(0, -1));
      const last = segments.at(-1);
      tracker.record(
        fullPath(segments),
        undefined,
        isObject(parent) && last !== undefined && last in parent,
      );
      if (!isObject(parent) || last === undefined || !(last in parent)) return;
      touched = true;
      Reflect.deleteProperty(parent, last);
      if (segments.length > 1 && Object.keys(parent).length === 0) {
        emptiedContainers.add(segments.slice(0, -1).join("\0"));
      }
    },
    snapshot: () => pruneEmptiedContainers(structuredClone(data)),
    initialValue: (path) => getAtPath(initial, toSegments(path)),
  };
};
