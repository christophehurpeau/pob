import type { InitialFiles } from "./files.ts";
import type { TrackedJson } from "./model.ts";
import type { Tracker } from "./tracker.ts";

/**
 * How an output file treats its current content:
 * - owned: the whole file is generated
 * - merged: rendered from a tracked model created from the current content
 * - seed: created only when absent, then belongs to the user
 * - section: generated from the current content (generated header, kept body)
 * - owned-if-pristine: rewritten only when the current content is one of the
 *   past outputs of pob, kept with a warning otherwise
 * - removed: deleted when present, a file or a directory
 */
export type FileStrategy =
  | "owned"
  | "merged"
  | "seed"
  | "section"
  | "owned-if-pristine"
  | "removed";

/** formatted with oxfmt when rendering */
export type FormatMode = "oxfmt" | false;

interface BaseOutput {
  path: string;
  owners: string[];
  format: FormatMode;
}

export type FileOutput =
  | (BaseOutput & { strategy: "owned" | "seed"; content: string })
  | (BaseOutput & {
      strategy: "section";
      render: (current: string | undefined) => string;
    })
  | (BaseOutput & {
      strategy: "owned-if-pristine";
      content: string;
      previousContents: readonly string[];
      warning?: string;
    })
  | (BaseOutput & {
      strategy: "merged";
      model: TrackedJson;
      serialize: (model: TrackedJson) => string;
      /** written even when the model is unchanged and the file is absent */
      always: boolean;
    })
  | (BaseOutput & { strategy: "removed" });

export class OutputConflictError extends Error {
  constructor(filePath: string, owners: string[], step: string) {
    super(
      `step "${step}" outputs ${filePath} differently than ${owners.map((owner) => `"${owner}"`).join(", ")}`,
    );
    this.name = "OutputConflictError";
  }
}

interface OutputOptions {
  format?: FormatMode;
}

export interface OutputRegistry {
  owned: (filePath: string, content: string, options?: OutputOptions) => void;
  seed: (filePath: string, content: string, options?: OutputOptions) => void;
  section: (
    filePath: string,
    render: (current: string | undefined) => string,
    options?: OutputOptions,
  ) => void;
  ownedIfPristine: (
    filePath: string,
    content: string,
    previousContents: readonly string[],
    options?: OutputOptions & { warning?: string },
  ) => void;
  merged: (
    filePath: string,
    model: TrackedJson,
    serialize: (model: TrackedJson) => string,
    options?: OutputOptions & { always?: boolean },
  ) => void;
  /** delete a file or a directory when present */
  removed: (filePath: string) => void;
  get: (filePath: string) => FileOutput | undefined;
  list: () => FileOutput[];
}

const sameOutput = (a: FileOutput, b: FileOutput): boolean => {
  if (a.strategy !== b.strategy || a.format !== b.format) return false;
  if (a.strategy === "removed") return true;
  if ("content" in a && "content" in b) return a.content === b.content;
  return false;
};

export const createOutputRegistry = (tracker: Tracker): OutputRegistry => {
  const outputs = new Map<string, FileOutput>();

  const add = (output: FileOutput): void => {
    tracker.checkFileWrite(output.path);
    const step = tracker.current?.name ?? "engine";
    const existing = outputs.get(output.path);
    if (existing) {
      const overridden = existing.owners.every((owner) =>
        tracker.current?.overrides.includes(owner),
      );
      if (!overridden && !sameOutput(existing, output)) {
        throw new OutputConflictError(output.path, existing.owners, step);
      }
      if (!overridden) {
        if (!existing.owners.includes(step)) existing.owners.push(step);
        return;
      }
    }
    outputs.set(output.path, { ...output, owners: [step] });
  };

  return {
    owned: (filePath, content, options) => {
      add({
        path: filePath,
        strategy: "owned",
        content,
        owners: [],
        format: options?.format ?? false,
      });
    },
    seed: (filePath, content, options) => {
      add({
        path: filePath,
        strategy: "seed",
        content,
        owners: [],
        format: options?.format ?? false,
      });
    },
    section: (filePath, render, options) => {
      add({
        path: filePath,
        strategy: "section",
        render,
        owners: [],
        format: options?.format ?? false,
      });
    },
    ownedIfPristine: (filePath, content, previousContents, options) => {
      add({
        path: filePath,
        strategy: "owned-if-pristine",
        content,
        previousContents,
        warning: options?.warning,
        owners: [],
        format: options?.format ?? false,
      });
    },
    merged: (filePath, model, serialize, options) => {
      add({
        path: filePath,
        strategy: "merged",
        model,
        serialize,
        always: options?.always ?? false,
        owners: [],
        format: options?.format ?? false,
      });
    },
    removed: (filePath) => {
      add({ path: filePath, strategy: "removed", owners: [], format: false });
    },
    get: (filePath) => outputs.get(filePath),
    list: () => [...outputs.values()],
  };
};

export type RenderedFile =
  | {
      path: string;
      kind: "write";
      content: string;
      owners: string[];
      strategy: FileStrategy;
    }
  | {
      path: string;
      kind: "delete";
      directory: boolean;
      owners: string[];
      strategy: FileStrategy;
    }
  | { path: string; kind: "keep"; owners: string[]; warning?: string };

/**
 * Resolves every output against the current files. Formatting is applied by
 * the caller, once, on the `write` results that ask for it.
 */
export const resolveOutput = (
  output: FileOutput,
  initial: InitialFiles,
): RenderedFile => {
  const current = initial.read(output.path);
  const base = { path: output.path, owners: output.owners };
  switch (output.strategy) {
    case "owned":
      return {
        ...base,
        kind: "write",
        content: output.content,
        strategy: output.strategy,
      };
    case "seed":
      return current === undefined
        ? {
            ...base,
            kind: "write",
            content: output.content,
            strategy: output.strategy,
          }
        : { ...base, kind: "keep" };
    case "section":
      return {
        ...base,
        kind: "write",
        content: output.render(current),
        strategy: output.strategy,
      };
    case "owned-if-pristine":
      if (
        current === undefined ||
        current === output.content ||
        output.previousContents.includes(current)
      ) {
        return {
          ...base,
          kind: "write",
          content: output.content,
          strategy: output.strategy,
        };
      }
      return { ...base, kind: "keep", warning: output.warning };
    case "merged":
      if (current === undefined && !output.model.touched && !output.always) {
        return { ...base, kind: "keep" };
      }
      return {
        ...base,
        kind: "write",
        content: output.serialize(output.model),
        strategy: output.strategy,
      };
    case "removed":
      return {
        ...base,
        kind: "delete",
        directory: initial.isDirectory(output.path),
        strategy: output.strategy,
      };
    default:
      throw new Error("Unknown strategy");
  }
};
