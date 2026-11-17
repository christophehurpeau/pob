import { spawnSync } from "node:child_process";
import sortObject from "@pob/sort-object";
import { FAILSAFE_SCHEMA, dump, loadAll } from "js-yaml";
import type { JsonObject, TrackedJson } from "../../engine/model.ts";

const isObject = (value: unknown): value is JsonObject =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/**
 * First document of a yaml config file. FAILSAFE_SCHEMA like the yeoman
 * generators: every scalar is read as a string.
 */
export const parseYamlConfig =
  (options: { json?: boolean } = {}) =>
  (content: string): JsonObject => {
    const [document] = loadAll(content, {
      schema: FAILSAFE_SCHEMA,
      json: options.json,
    });
    return isObject(document) ? document : {};
  };

export const serializeYamlConfig = (model: TrackedJson): string =>
  dump(sortObject(model.snapshot()), { lineWidth: 9999 });

export interface RunCommandOptions {
  env?: Record<string, string>;
  /** failures of builds were ignored by the yeoman generators */
  ignoreFailure?: boolean;
}

export const runCommand = (
  cwd: string,
  file: string,
  args: readonly string[],
  { env, ignoreFailure = false }: RunCommandOptions = {},
): void => {
  const result = spawnSync(file, args, {
    cwd,
    stdio: "inherit",
    env: env ? { ...process.env, ...env } : process.env,
  });
  if (ignoreFailure) return;
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `${[file, ...args].join(" ")} exited with ${String(result.status)}`,
    );
  }
};
