import { describe, expect, test } from "vitest";
import {
  isAllowedCommand,
  isGitConfigRead,
  isIpcConnection,
  parseShellLine,
} from "./guardRules.ts";

const root = "/repo";
const allowed = (file: string, args: string[], cwd = root): boolean =>
  isAllowedCommand({ file, args, cwd }, { root, execPath: "/bin/node" });

describe("isAllowedCommand", () => {
  test("allows local read-only git commands and git rm --cached", () => {
    expect(allowed("git", ["ls-files", "--", "dist"])).toBe(true);
    expect(allowed("git", ["rev-parse", "--git-dir"])).toBe(true);
    expect(allowed("git", ["remote", "get-url", "origin"])).toBe(true);
    expect(allowed("git", ["rm", "-r", "--cached", "--", "dist"])).toBe(true);
    expect(allowed("git", ["config", "--get", "remote.origin.url"])).toBe(true);
  });

  test("blocks the other git commands", () => {
    expect(allowed("git", ["rm", "dist"])).toBe(false);
    expect(allowed("git", ["remote", "add", "origin", "x"])).toBe(false);
    expect(allowed("git", ["push"])).toBe(false);
    expect(allowed("git", ["commit", "-m", "x"])).toBe(false);
    expect(allowed("git", [])).toBe(false);
  });

  test("blocks git global options before the subcommand", () => {
    expect(allowed("git", ["-c", "alias.x=!sh", "ls-files"])).toBe(false);
    expect(allowed("git", ["-C", "/elsewhere", "ls-files"])).toBe(false);
  });

  test("allows rm inside the fixture only", () => {
    expect(allowed("rm", ["-rf", "dist"])).toBe(true);
    expect(allowed("rm", ["-rf", "../other"])).toBe(false);
    expect(allowed("rm", ["-rf", "/"])).toBe(false);
    expect(allowed("rm", ["-rf", "."])).toBe(false);
    expect(allowed("rm", ["-rf"])).toBe(false);
  });

  test("allows node, blocks package managers", () => {
    expect(allowed("/bin/node", ["x.js"])).toBe(true);
    expect(allowed("yarn", ["install"])).toBe(false);
    expect(allowed("pnpm", ["--version"])).toBe(false);
  });
});

describe("isGitConfigRead", () => {
  test("allows reads of the repository config", () => {
    expect(isGitConfigRead(["--get", "user.name"])).toBe(true);
    expect(isGitConfigRead(["--get-all", "remote.origin.url"])).toBe(true);
    expect(isGitConfigRead(["--list"])).toBe(true);
    expect(isGitConfigRead(["-l"])).toBe(true);
    expect(isGitConfigRead(["get", "user.name"])).toBe(true);
  });

  test("blocks writes and other config files", () => {
    expect(isGitConfigRead(["user.name", "x"])).toBe(false);
    expect(isGitConfigRead(["set", "user.name", "x"])).toBe(false);
    expect(isGitConfigRead(["--global", "user.name", "x"])).toBe(false);
    expect(isGitConfigRead(["--global", "--get", "user.name"])).toBe(false);
    expect(isGitConfigRead(["--system", "--list"])).toBe(false);
    expect(isGitConfigRead(["--file=x", "--get", "a.b"])).toBe(false);
    expect(isGitConfigRead(["--get", "a.b", "--add", "c"])).toBe(false);
    expect(isGitConfigRead(["--unset", "user.name"])).toBe(false);
  });
});

describe("parseShellLine", () => {
  test("parses one plain command", () => {
    expect(parseShellLine("git ls-files  dist", root)).toEqual({
      file: "git",
      args: ["ls-files", "dist"],
      cwd: root,
    });
  });

  test.each([
    "git ls-files && yarn install",
    "git ls-files; yarn install",
    "git ls-files || yarn install",
    "git ls-files | sh",
    "git ls-files\nyarn install",
    "git ls-files $(yarn install)",
    "git ls-files `yarn install`",
    "git ls-files > out",
    "git config '--global' user.name x",
    String.raw`git config \--global user.name x`,
    "git ls-files &",
  ])("refuses %j", (line) => {
    expect(parseShellLine(line, root)).toBeUndefined();
  });
});

describe("isIpcConnection", () => {
  test("allows unix sockets and pipes", () => {
    expect(isIpcConnection(["/tmp/socket"])).toBe(true);
    expect(isIpcConnection([{ path: "/tmp/socket" }])).toBe(true);
    expect(isIpcConnection([[{ path: "/tmp/socket" }, null]])).toBe(true);
  });

  test("refuses tcp connections", () => {
    expect(isIpcConnection([443, "example.com"])).toBe(false);
    expect(isIpcConnection(["443"])).toBe(false);
    expect(isIpcConnection([{ port: 443, host: "example.com" }])).toBe(false);
    expect(isIpcConnection([[{ port: 443 }, null]])).toBe(false);
  });
});
