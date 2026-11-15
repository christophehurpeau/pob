import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import type { PackageContext } from "../engine/context.ts";
import type { PathSegments } from "../engine/paths.ts";
import type { PipelineResult } from "../engine/pipeline.ts";
import type { WriteRecord } from "../engine/tracker.ts";
import { getAtPath } from "../engine/tracker.ts";
import { stepConfigKeys } from "./stepConfigKeys.ts";
import type { CliIO } from "./update.ts";
import { consoleIO, runUpdatePipeline } from "./update.ts";

export interface ExplainTarget {
  /** relative to the directory pob runs in, posix */
  file: string;
  /** dotted path in a merged file */
  key: string[] | undefined;
}

export const parseExplainTarget = (argument: string): ExplainTarget => {
  const hashIndex = argument.indexOf("#");
  const file = hashIndex === -1 ? argument : argument.slice(0, hashIndex);
  const key = hashIndex === -1 ? "" : argument.slice(hashIndex + 1);
  return {
    file: path.posix.normalize(file.split(path.sep).join("/")),
    key: key ? key.split(".") : undefined,
  };
};

const isInLocation = (location: string, file: string): boolean =>
  location === "." || file.startsWith(`${location}/`);

/** The package a file belongs to: the deepest location containing it. */
export const findFileContext = (
  contexts: readonly PackageContext[],
  file: string,
): { ctx: PackageContext; localPath: string } | undefined => {
  const ctx = contexts
    .filter((candidate) => isInLocation(candidate.location, file))
    .toSorted((a, b) => b.location.length - a.location.length)[0];
  if (!ctx) return undefined;
  return {
    ctx,
    localPath:
      ctx.location === "." ? file : file.slice(ctx.location.length + 1),
  };
};

const CHAIN_SEGMENT = "\0chain";

const formatSegments = (segments: PathSegments): string =>
  segments
    .map((segment) => (segment === CHAIN_SEGMENT ? "<chain>" : segment))
    .join(".");

const formatValue = (value: unknown): string =>
  value === undefined ? "(removed)" : JSON.stringify(value);

const isPrefix = (prefix: PathSegments, segments: PathSegments): boolean =>
  prefix.length <= segments.length &&
  prefix.every((segment, index) => segment === segments[index]);

/** Writes on the key, on its parents and on its children. */
const recordsForKey = (
  ctx: PackageContext,
  modelName: string,
  key: PathSegments,
): WriteRecord[] =>
  ctx.tracker
    .allRecords()
    .filter((record) => {
      if (record.path[0] !== modelName) return false;
      const recordKey = record.path.slice(1);
      return isPrefix(key, recordKey) || isPrefix(recordKey, key);
    })
    .filter(
      (record, index, records) =>
        records.findIndex(
          (other) =>
            other.step === record.step &&
            isDeepStrictEqual(other.path, record.path) &&
            isDeepStrictEqual(other.value, record.value),
        ) === index,
    );

const modelWriters = (ctx: PackageContext, modelName: string): string[] => [
  ...new Set(
    ctx.tracker
      .allRecords()
      .filter((record) => record.path[0] === modelName)
      .map((record) => record.step),
  ),
];

const formatConfigKeys = (stepNames: readonly string[]): string[] =>
  stepNames.map((step) => {
    const keys = stepConfigKeys[step];
    if (!keys) return `    ${step}: unknown`;
    return `    ${step}: ${keys.length > 0 ? keys.join(", ") : "none (always runs the same way)"}`;
  });

const readFinalValue = (
  result: PipelineResult,
  ctx: PackageContext,
  { file, localPath, key }: { file: string; localPath: string; key: string[] },
): unknown => {
  const output = ctx.output.get(localPath);
  if (output?.strategy === "merged" && !localPath.endsWith(".json")) {
    return output.model.peek(key);
  }
  const planned = result.plan.files.find(
    (candidate) => candidate.path === file,
  );
  const content =
    planned?.op === "delete"
      ? undefined
      : (planned?.after ?? ctx.initial.read(localPath));
  if (content === undefined) return undefined;
  try {
    return getAtPath(JSON.parse(content), key);
  } catch {
    return output?.strategy === "merged" ? output.model.peek(key) : undefined;
  }
};

/** The explanation of a file, or of a key in a merged file, as lines. */
export const explainTarget = (
  result: PipelineResult,
  target: ExplainTarget,
): string[] => {
  const found = findFileContext(result.contexts, target.file);
  const output = found?.ctx.output.get(found.localPath);
  if (!found || !output) {
    return [
      `${target.file}: not managed by pob, edit it freely (the effects may still change it)`,
    ];
  }
  const { ctx, localPath } = found;
  const planned = result.plan.files.find((file) => file.path === target.file);
  const owners =
    output.strategy === "merged"
      ? modelWriters(ctx, output.model.name)
      : output.owners;
  const lines = [
    target.file,
    `  strategy: ${output.strategy}`,
    `  owner steps: ${owners.join(", ") || "none"}`,
    `  pending change: ${planned ? planned.op : "none"}`,
  ];
  if (!target.key) {
    lines.push(
      "  config keys of the owner steps:",
      ...formatConfigKeys(owners),
    );
    return lines;
  }
  if (output.strategy !== "merged") {
    lines.push(
      `  #${target.key.join(".")}: keys are tracked in merged files only, this file is ${output.strategy}`,
    );
    return lines;
  }
  const records = recordsForKey(ctx, output.model.name, target.key);
  lines.push(
    `  #${target.key.join(".")}: ${formatValue(readFinalValue(result, ctx, { file: target.file, localPath, key: target.key }))}`,
  );
  if (records.length === 0) {
    lines.push("  no step writes this key: it is kept as it is");
    return lines;
  }
  lines.push("  written by:");
  for (const record of records) {
    lines.push(
      `    ${record.step}: ${formatSegments(record.path.slice(1))} = ${formatValue(record.value)}`,
    );
  }
  lines.push(
    "  config keys of these steps:",
    ...formatConfigKeys([...new Set(records.map((record) => record.step))]),
  );
  return lines;
};

/** `pob explain <file>[#key]`: runs the pipeline in check mode */
export const runExplain = async (
  { cwd, argument }: { cwd: string; argument: string },
  io: CliIO = consoleIO,
): Promise<number> => {
  const result = await runUpdatePipeline({ cwd, check: true, fromPob: false });
  io.log(explainTarget(result, parseExplainTarget(argument)).join("\n"));
  return 0;
};
