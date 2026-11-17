import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

const guardPath = path.join(import.meta.dirname, "guard.ts");

/**
 * Without the variables git hooks set (pre-push runs the tests): git would
 * act on this repository, `git init` would make it bare.
 */
const testEnv = (): NodeJS.ProcessEnv => {
  const env = { ...process.env };
  for (const name of ["GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE"]) {
    Reflect.deleteProperty(env, name);
  }
  return env;
};

let directory: string;

beforeEach(() => {
  directory = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), "pob-guard-")),
  );
});

afterEach(() => {
  fs.rmSync(directory, { recursive: true, force: true });
});

/** runs an ES module with the guard, returns what it printed and logged */
const runGuarded = (
  source: string,
): { stdout: string; stderr: string; log: string[] } => {
  const logPath = path.join(directory, "guard.log");
  const scriptPath = path.join(directory, "script.mjs");
  fs.writeFileSync(scriptPath, source);
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: directory,
    encoding: "utf8",
    env: {
      ...testEnv(),
      NODE_OPTIONS: `--import ${guardPath}`,
      POB_HARNESS_LOG: logPath,
      POB_HARNESS_ROOT: directory,
    },
  });
  return {
    stdout: result.stdout,
    stderr: result.stderr,
    log: fs.existsSync(logPath)
      ? fs.readFileSync(logPath, "utf8").split("\n").filter(Boolean)
      : [],
  };
};

const blockedMessage = (code: string): string => `
try {
  await (async () => { ${code} })();
  console.log("not blocked");
} catch (error) {
  console.log(error.message.includes("network access blocked") ? "blocked" : error.message);
}`;

// every test spawns node with the guard: slow when the whole suite runs
describe("harness guard", { timeout: 30_000 }, () => {
  test.each([
    ["fetch", 'await fetch("https://example.com");'],
    [
      "http",
      'const http = await import("node:http"); http.get("http://example.com");',
    ],
    [
      "https",
      'const { request } = await import("node:https"); request("https://example.com");',
    ],
    [
      "net",
      'const net = await import("node:net"); net.connect(443, "example.com");',
    ],
    [
      "net socket",
      'const { Socket } = await import("node:net"); new Socket().connect(443, "example.com");',
    ],
    [
      "tls",
      'const tls = await import("node:tls"); tls.connect(443, "example.com");',
    ],
    [
      "dns",
      'const dns = await import("node:dns"); await dns.promises.lookup("example.com");',
    ],
    ["WebSocket", 'new WebSocket("wss://example.com");'],
  ])("blocks %s", (_name, code) => {
    expect(runGuarded(blockedMessage(code)).stdout.trim()).toBe("blocked");
  });

  test("blocks a shell line chaining a blocked command", () => {
    const { stdout, log } = runGuarded(`
import { execSync } from "node:child_process";
execSync("git ls-files && touch chained", { encoding: "utf8" });
console.log(String((await import("node:fs")).existsSync("chained")));
`);
    expect(stdout.trim()).toBe("false");
    expect(log).toHaveLength(1);
    expect(JSON.parse(log[0] ?? "{}")).toMatchObject({ blocked: true });
  });

  test("blocks spawn with a shell", () => {
    const { stdout } = runGuarded(`
import { spawnSync } from "node:child_process";
spawnSync("git", ["ls-files;", "touch", "chained"], { shell: true });
console.log(String((await import("node:fs")).existsSync("chained")));
`);
    expect(stdout.trim()).toBe("false");
  });

  test("blocks git config writes", () => {
    const { log } = runGuarded(`
import { execFileSync } from "node:child_process";
execFileSync("git", ["config", "--global", "user.name", "x"]);
`);
    expect(log.map((line) => JSON.parse(line) as unknown)).toEqual([
      { cwd: ".", command: "git config --global user.name x", blocked: true },
    ]);
  });

  test("runs allowed commands and blocks git init", () => {
    spawnSync("git", ["init", "--quiet"], { cwd: directory, env: testEnv() });
    const { stdout, log } = runGuarded(`
import { execFileSync } from "node:child_process";
execFileSync("git", ["init", "--quiet", "other"]);
console.log(execFileSync("git", ["rev-parse", "--is-inside-work-tree"], { encoding: "utf8" }).trim());
`);
    expect(stdout.trim()).toBe("true");
    expect(log.map((line) => JSON.parse(line) as unknown)).toEqual([
      { cwd: ".", command: "git init --quiet other", blocked: true },
      {
        cwd: ".",
        command: "git rev-parse --is-inside-work-tree",
        blocked: false,
      },
    ]);
  });
});
