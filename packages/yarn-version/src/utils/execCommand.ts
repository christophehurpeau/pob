import childProcess from "node:child_process";
import type { Workspace } from "./packageUtils";

interface ExecResultIfFailed {
  code: number | null;
  signal: string | null;
  stdout: string;
  stderr: string;
}

interface ExecResultIfSuccess {
  code: null;
  signal: null;
  stdout: string;
  stderr: string;
}

type ExecResult<Strict extends boolean> = Strict extends true
  ? ExecResultIfSuccess
  : ExecResultIfFailed;

async function execvp<const Strict extends boolean>(
  command: string,
  args: string[],
  {
    cwd = process.cwd(),
    env = process.env,
    encoding,
    strict,
    stdo = "pipe",
  }: {
    cwd?: string;
    env?: typeof process.env;
    encoding?: BufferEncoding;
    strict?: Strict;
    stdo?: "inherit" | "pipe";
  },
): Promise<ExecResult<Strict>> {
  const stdoutChunks: Uint8Array[] = [];
  const stderrChunks: Uint8Array[] = [];
  if (env.PWD !== undefined) {
    env = { ...env, PWD: cwd };
  }
  const subprocess = childProcess.spawn(command, args, {
    cwd,
    env,
    stdio: ["ignore", stdo, stdo],
  });
  subprocess.stdout?.on("data", (chunk) => {
    stdoutChunks.push(chunk);
  });
  subprocess.stderr?.on("data", (chunk) => {
    stderrChunks.push(chunk);
  });
  return new Promise((resolve, reject) => {
    subprocess.on("error", (err) => {
      reject(new Error(`Process ${command} failed to spawn`));
    });
    subprocess.on("close", (code, signal) => {
      const chunksToString = (chunks: Uint8Array[]): string =>
        stdo === "inherit"
          ? ""
          : Buffer.concat(chunks).toString(encoding ?? "utf8");
      const stdout = chunksToString(stdoutChunks);
      const stderr = chunksToString(stderrChunks);
      if (code === 0 || !strict) {
        resolve({
          code,
          signal,
          stdout,
          stderr,
        } as ExecResult<Strict>);
      } else {
        reject(
          new Error(
            `Process ${[command, ...args].join(" ")} exited ${code !== null ? `with code ${code}` : `with signal ${signal || ""}`}:\nstdout: ${stdout.toString()}\nstderr: ${stderr.toString()}`,
          ),
        );
      }
    });
  });
}

export const execCommand = (
  workspace: Workspace,
  commandAndArgs: string[] = [],
  stdo: "inherit" | "pipe" = "pipe",
): ReturnType<typeof execvp> => {
  const [command, ...args] = commandAndArgs;
  return execvp(command, args, {
    cwd: workspace.cwd,
    strict: true,
    stdo,
  });
};
