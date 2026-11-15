/**
 * Loaded with `node --import` in every pob process run by the harness (also
 * the child processes, through NODE_OPTIONS).
 *
 * It blocks the network and every external command that installs, builds or
 * talks to a remote: they are recorded in POB_HARNESS_LOG instead. Only local
 * read-only git commands, `git rm --cached`, `rm` and pob itself really run.
 */
import childProcess from "node:child_process";
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import path from "node:path";

const logPath = process.env.POB_HARNESS_LOG;
const root = fs.realpathSync(process.env.POB_HARNESS_ROOT ?? process.cwd());

interface Command {
  file: string;
  args: string[];
  cwd: string;
}

const allowedGitSubcommands = new Set([
  "rev-parse",
  "ls-files",
  "config",
  "rm",
]);

const isAllowed = ({ file, args }: Command): boolean => {
  const name = path.basename(file);
  if (file === process.execPath || name === "node") return true;
  if (name === "git") {
    const subcommand = args.find((arg) => !arg.startsWith("-"));
    if (subcommand === "rm") return args.includes("--cached");
    if (subcommand === "remote") return args.includes("get-url");
    return subcommand !== undefined && allowedGitSubcommands.has(subcommand);
  }
  return name === "rm";
};

const record = (command: Command, blocked: boolean): void => {
  if (!logPath) return;
  fs.appendFileSync(
    logPath,
    `${JSON.stringify({
      cwd: path.relative(root, command.cwd) || ".",
      command: [path.basename(command.file), ...command.args].join(" "),
      blocked,
    })}\n`,
  );
};

const fakeResult = (
  options: { encoding?: string } | undefined,
  file: string,
): childProcess.SpawnSyncReturns<Buffer | string> => {
  const asString =
    options?.encoding !== undefined && options.encoding !== "buffer";
  const empty = asString ? "" : Buffer.alloc(0);
  // no keychain token: the github generator then skips its API calls
  const status = path.basename(file) === "security" ? 1 : 0;
  return {
    pid: 0,
    status,
    signal: null,
    output: [null, empty, empty],
    stdout: empty,
    stderr: empty,
  };
};

const parseShellCommand = (command: string, cwd: string): Command => {
  const [file = "", ...args] = command.trim().split(/\s+/);
  return { file, args, cwd };
};

const getCwd = (options: unknown): string => {
  const cwd = (options as { cwd?: string | URL } | undefined)?.cwd;
  const resolved = cwd
    ? path.resolve(cwd instanceof URL ? cwd.pathname : cwd)
    : process.cwd();
  try {
    return fs.realpathSync(resolved);
  } catch {
    return resolved;
  }
};

const originalSpawnSync = childProcess.spawnSync;
const originalExecSync = childProcess.execSync;
const originalExecFileSync = childProcess.execFileSync;

const patched = childProcess as unknown as Record<string, unknown>;

patched.spawnSync = (
  file: string,
  argsOrOptions?: readonly string[] | childProcess.SpawnSyncOptions,
  maybeOptions?: childProcess.SpawnSyncOptions,
) => {
  const args = Array.isArray(argsOrOptions)
    ? [...(argsOrOptions as readonly string[])]
    : [];
  const options = (
    Array.isArray(argsOrOptions) ? maybeOptions : argsOrOptions
  ) as childProcess.SpawnSyncOptions | undefined;
  const command = { file, args, cwd: getCwd(options) };
  const allowed = isAllowed(command);
  record(command, !allowed);
  if (allowed) {
    return Reflect.apply(originalSpawnSync, childProcess, [
      file,
      args,
      options,
    ]) as unknown;
  }
  return fakeResult(options as { encoding?: string }, file);
};

patched.execSync = (
  commandLine: string,
  options?: childProcess.ExecSyncOptions,
) => {
  const command = parseShellCommand(commandLine, getCwd(options));
  const allowed = isAllowed(command);
  record(command, !allowed);
  if (allowed) {
    return Reflect.apply(originalExecSync, childProcess, [
      commandLine,
      options,
    ]) as unknown;
  }
  return options?.encoding && options.encoding !== "buffer"
    ? ""
    : Buffer.alloc(0);
};

patched.execFileSync = (
  file: string,
  argsOrOptions?: readonly string[] | childProcess.ExecFileSyncOptions,
  maybeOptions?: childProcess.ExecFileSyncOptions,
) => {
  const args = Array.isArray(argsOrOptions)
    ? [...(argsOrOptions as readonly string[])]
    : [];
  const options = (
    Array.isArray(argsOrOptions) ? maybeOptions : argsOrOptions
  ) as childProcess.ExecFileSyncOptions | undefined;
  const command = { file, args, cwd: getCwd(options) };
  const allowed = isAllowed(command);
  record(command, !allowed);
  if (allowed) {
    return Reflect.apply(originalExecFileSync, childProcess, [
      file,
      args,
      options,
    ]) as unknown;
  }
  return options?.encoding && options.encoding !== "buffer"
    ? ""
    : Buffer.alloc(0);
};

const originalSpawn = childProcess.spawn;
patched.spawn = (
  file: string,
  argsOrOptions?: readonly string[] | childProcess.SpawnOptions,
  maybeOptions?: childProcess.SpawnOptions,
) => {
  const args = Array.isArray(argsOrOptions)
    ? [...(argsOrOptions as readonly string[])]
    : [];
  const options = (
    Array.isArray(argsOrOptions) ? maybeOptions : argsOrOptions
  ) as childProcess.SpawnOptions | undefined;
  const command = { file, args, cwd: getCwd(options) };
  const allowed = isAllowed(command);
  record(command, !allowed);
  return Reflect.apply(originalSpawn, childProcess, [
    allowed ? file : "true",
    allowed ? args : [],
    options,
  ]) as unknown;
};

for (const name of ["exec", "execFile"] as const) {
  patched[name] = (...args: unknown[]) => {
    throw new Error(
      `pob harness: async child_process.${name} is not supported: ${JSON.stringify(args[0])}`,
    );
  };
}

syncBuiltinESMExports();

globalThis.fetch = (input: unknown) => {
  throw new Error(`pob harness: network access blocked: ${String(input)}`);
};
