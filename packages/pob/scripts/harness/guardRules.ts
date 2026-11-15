/**
 * What the harness guard lets run: pure functions, tested apart from guard.ts,
 * which patches node on import.
 */
import path from "node:path";

export interface Command {
  file: string;
  args: string[];
  cwd: string;
}

const readOnlyGitSubcommands = new Set(["rev-parse", "ls-files"]);

const gitConfigReadFlags = new Set([
  "--get",
  "--get-all",
  "--get-regexp",
  "--get-urlmatch",
  "--list",
  "-l",
]);

/** writes, or reads of a config outside the repository */
const gitConfigForbiddenArgs = new Set([
  "--global",
  "--system",
  "--file",
  "-f",
  "--blob",
  "--add",
  "--unset",
  "--unset-all",
  "--replace-all",
  "--rename-section",
  "--remove-section",
  "--edit",
  "-e",
]);

/** `git config` reading the config of the repository, nothing else */
export const isGitConfigRead = (configArgs: readonly string[]): boolean => {
  if (
    configArgs.some(
      (arg) =>
        gitConfigForbiddenArgs.has(arg) ||
        arg.startsWith("--file=") ||
        arg.startsWith("--blob="),
    )
  ) {
    return false;
  }
  const [first] = configArgs;
  if (first === "get" || first === "list") return true;
  return configArgs.some((arg) => gitConfigReadFlags.has(arg));
};

const isInside = (root: string, cwd: string, target: string): boolean => {
  const relative = path.relative(root, path.resolve(cwd, target));
  return (
    relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative)
  );
};

/**
 * Local read-only git, `git rm --cached`, `rm` inside the fixture and node
 * itself. Git global options (`-c`, `-C`...) are refused: the subcommand must
 * come first.
 */
export const isAllowedCommand = (
  { file, args, cwd }: Command,
  { root, execPath }: { root: string; execPath: string },
): boolean => {
  const name = path.basename(file);
  if (file === execPath || name === "node") return true;
  if (name === "git") {
    const [subcommand, ...rest] = args;
    if (subcommand === "rm") return rest.includes("--cached");
    if (subcommand === "remote") return rest[0] === "get-url";
    if (subcommand === "config") return isGitConfigRead(rest);
    return subcommand !== undefined && readOnlyGitSubcommands.has(subcommand);
  }
  if (name === "rm") {
    const targets = args.filter((arg) => !arg.startsWith("-"));
    return (
      targets.length > 0 &&
      targets.every((target) => isInside(root, cwd, target))
    );
  }
  return false;
};

/**
 * Characters that make a shell line more than one plain command (lists,
 * pipes, substitutions, redirections, quoting, escapes): such a line is
 * blocked as a whole instead of being parsed.
 */
const shellMetacharacters = /[\n\r"$&'()*;<>?[\\\]`{|}~]/;

/**
 * The command of a shell line, or undefined when the line is not one plain
 * command and must be blocked.
 */
export const parseShellLine = (
  line: string,
  cwd: string,
): Command | undefined => {
  if (shellMetacharacters.test(line)) return undefined;
  const [file, ...args] = line.trim().split(/\s+/);
  if (!file) return undefined;
  return { file, args, cwd };
};

/** whether a `net` connection is local IPC (a unix socket or a pipe) */
export const isIpcConnection = (args: readonly unknown[]): boolean => {
  let [first] = args;
  // net.connect(options) and socket.connect([options]) as called internally
  if (Array.isArray(first)) [first] = first as unknown[];
  if (typeof first === "string") return !/^\d+$/.test(first);
  if (first !== null && typeof first === "object") {
    return typeof (first as { path?: unknown }).path === "string";
  }
  return false;
};
