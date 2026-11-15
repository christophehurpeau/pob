import { describe, expect, test } from "vitest";
import { UsageError, parseCliArgs } from "./args.ts";

describe("parseCliArgs", () => {
  test("update, from-pob, check, json, force", () => {
    expect(parseCliArgs(["update"])).toEqual({
      name: "update",
      check: false,
      json: false,
      fromPob: false,
    });
    expect(parseCliArgs(["update", "from-pob", "--force"])).toEqual({
      name: "update",
      check: false,
      json: false,
      fromPob: true,
    });
    expect(parseCliArgs(["--check", "--json"])).toEqual({
      name: "update",
      check: true,
      json: true,
      fromPob: false,
    });
  });

  test("monorepo and lerna prefixes are accepted", () => {
    expect(parseCliArgs(["monorepo", "update", "--check"])).toMatchObject({
      name: "update",
      check: true,
    });
    expect(parseCliArgs(["lerna", "lib"])).toEqual({
      name: "init",
      type: "lib",
    });
  });

  test("init, lib, app, and init by default", () => {
    expect(parseCliArgs([])).toEqual({ name: "init", type: undefined });
    expect(parseCliArgs(["init"])).toEqual({ name: "init", type: undefined });
    expect(parseCliArgs(["app"])).toEqual({ name: "init", type: "app" });
  });

  test("add", () => {
    expect(parseCliArgs(["add", "@scope/a"])).toEqual({
      name: "add",
      packageName: "@scope/a",
      app: undefined,
    });
    expect(
      parseCliArgs(["add", "a", "--app", "vite", "--testing", "--e2e"]),
    ).toEqual({
      name: "add",
      packageName: "a",
      app: { type: "vite", testing: true, e2e: true },
    });
    expect(() => parseCliArgs(["add"])).toThrow(UsageError);
    expect(() => parseCliArgs(["add", "a", "--app", "remix"])).toThrow(
      "Invalid --app: remix",
    );
  });

  test("explain, config, migrate-to-monorepo, help, version", () => {
    expect(parseCliArgs(["explain", "package.json#scripts.lint"])).toEqual({
      name: "explain",
      argument: "package.json#scripts.lint",
    });
    expect(() => parseCliArgs(["explain"])).toThrow(UsageError);
    expect(parseCliArgs(["config"])).toEqual({ name: "config" });
    expect(parseCliArgs(["migrate-to-monorepo"])).toEqual({
      name: "migrate-to-monorepo",
    });
    expect(parseCliArgs(["help"])).toEqual({ name: "help" });
    expect(parseCliArgs(["update", "-h"])).toEqual({ name: "help" });
    expect(parseCliArgs(["--version"])).toEqual({ name: "version" });
  });

  test("usage errors", () => {
    expect(() => parseCliArgs(["lib", "--check"])).toThrow(
      "--check can only be used with update",
    );
    expect(() => parseCliArgs(["update", "--json"])).toThrow(
      "--json can only be used with --check",
    );
    expect(() => parseCliArgs(["update", "other"])).toThrow(UsageError);
    expect(() => parseCliArgs(["unknown"])).toThrow("Unknown command: unknown");
    expect(() => parseCliArgs(["--bogus"])).toThrow(UsageError);
  });
});
