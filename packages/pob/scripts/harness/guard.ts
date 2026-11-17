/**
 * Loaded with `node --import` in every pob process run by the harness (also
 * the child processes, through NODE_OPTIONS).
 *
 * It blocks the network and every external command that installs, builds or
 * talks to a remote: they are recorded in POB_HARNESS_LOG instead. Only local
 * read-only git commands, `git rm --cached`, `rm` inside the fixture and pob
 * itself really run (see guardRules.ts). A shell line runs only when it is one
 * plain allowed command.
 */
import childProcess from "node:child_process";
import dns from "node:dns";
import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import { syncBuiltinESMExports } from "node:module";
import net from "node:net";
import path from "node:path";
import tls from "node:tls";
import type { Command } from "./guardRules.ts";
import {
  isAllowedCommand,
  isIpcConnection,
  parseShellLine,
} from "./guardRules.ts";

const logPath = process.env.POB_HARNESS_LOG;
const root = fs.realpathSync(process.env.POB_HARNESS_ROOT ?? process.cwd());

const isAllowed = (command: Command): boolean =>
  isAllowedCommand(command, { root, execPath: process.execPath });

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

/** a pob child process (one per monorepo package) that failed */
const recordFailure = (command: Command, status: number | null): void => {
  if (!logPath) return;
  fs.appendFileSync(
    logPath,
    `${JSON.stringify({
      cwd: path.relative(root, command.cwd) || ".",
      command: `pob child process exited with ${String(status)}`,
      blocked: false,
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

/** the command to check: the shell line, parsed, when a shell runs it */
const toCommand = (
  file: string,
  args: string[],
  options: { shell?: unknown } | undefined,
  cwd: string,
): { command: Command; allowed: boolean } => {
  if (!options?.shell) {
    const command = { file, args, cwd };
    return { command, allowed: isAllowed(command) };
  }
  const line = [file, ...args].join(" ");
  const parsed = parseShellLine(line, cwd);
  return parsed
    ? { command: parsed, allowed: isAllowed(parsed) }
    : { command: { file: line, args: [], cwd }, allowed: false };
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
  const { command, allowed } = toCommand(file, args, options, getCwd(options));
  record(command, !allowed);
  if (allowed) {
    const result = Reflect.apply(originalSpawnSync, childProcess, [
      file,
      args,
      options,
    ]) as childProcess.SpawnSyncReturns<unknown>;
    if (result.status !== 0 && path.basename(file) === "node") {
      recordFailure(command, result.status);
    }
    return result;
  }
  return fakeResult(options as { encoding?: string }, file);
};

patched.execSync = (
  commandLine: string,
  options?: childProcess.ExecSyncOptions,
) => {
  const cwd = getCwd(options);
  const parsed = parseShellLine(commandLine, cwd);
  const command = parsed ?? { file: commandLine, args: [], cwd };
  const allowed = parsed !== undefined && isAllowed(parsed);
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
  const { command, allowed } = toCommand(file, args, options, getCwd(options));
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
  const { command, allowed } = toCommand(file, args, options, getCwd(options));
  record(command, !allowed);
  return Reflect.apply(originalSpawn, childProcess, [
    allowed ? file : "true",
    allowed ? args : [],
    allowed ? options : { ...options, shell: false },
  ]) as unknown;
};

for (const name of ["exec", "execFile"] as const) {
  patched[name] = (...args: unknown[]) => {
    throw new Error(
      `pob harness: async child_process.${name} is not supported: ${JSON.stringify(args[0])}`,
    );
  };
}

const networkBlocked = (what: string): Error =>
  new Error(`pob harness: network access blocked: ${what}`);

const blockNetwork = (
  module: object,
  moduleName: string,
  names: readonly string[],
): void => {
  const target = module as Record<string, unknown>;
  for (const name of names) {
    if (typeof target[name] !== "function") continue;
    target[name] = (...args: unknown[]) => {
      throw networkBlocked(`${moduleName}.${name}(${String(args[0])})`);
    };
  }
};

blockNetwork(http, "http", ["request", "get"]);
blockNetwork(https, "https", ["request", "get"]);
blockNetwork(tls, "tls", ["connect"]);
blockNetwork(dns, "dns", [
  "lookup",
  "lookupService",
  "resolve",
  "resolve4",
  "resolve6",
  "resolveAny",
  "resolveCname",
  "resolveMx",
  "resolveNs",
  "resolveSrv",
  "resolveTxt",
  "reverse",
]);
blockNetwork(dns.promises, "dns.promises", ["lookup", "resolve", "resolveAny"]);

// net.connect, tls and undici (also the one behind fetch) all end in
// Socket.prototype.connect; IPC through unix sockets and pipes stays allowed
const originalNetConnect = net.connect;
const originalSocketConnect = net.Socket.prototype.connect;
const guardedNetConnect = (...args: unknown[]): unknown => {
  if (!isIpcConnection(args)) {
    throw networkBlocked(`net.connect(${JSON.stringify(args[0])})`);
  }
  return Reflect.apply(originalNetConnect, net, args);
};
(net as unknown as Record<string, unknown>).connect = guardedNetConnect;
(net as unknown as Record<string, unknown>).createConnection =
  guardedNetConnect;
net.Socket.prototype.connect = function connect(
  this: net.Socket,
  ...args: unknown[]
) {
  if (!isIpcConnection(args)) {
    throw networkBlocked(`socket.connect(${JSON.stringify(args[0])})`);
  }
  return originalSocketConnect.apply(this, args as never);
};

syncBuiltinESMExports();

globalThis.fetch = (input: unknown) => {
  throw networkBlocked(`fetch(${String(input)})`);
};
for (const name of ["WebSocket", "EventSource"]) {
  Reflect.defineProperty(globalThis, name, {
    configurable: true,
    get: () => {
      throw networkBlocked(name);
    },
  });
}
