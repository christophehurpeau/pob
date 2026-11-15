import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { findMonorepoRoot } from "./pipeline.ts";

let dir: string;

const writeJson = (file: string, value: unknown): void => {
  fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  fs.writeFileSync(path.join(dir, file), JSON.stringify(value));
};

beforeEach(() => {
  dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "pob-root-")));
  writeJson("package.json", { name: "root", workspaces: ["packages/*"] });
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("findMonorepoRoot", () => {
  test("a workspace of the root", () => {
    writeJson("packages/a/package.json", { name: "a" });
    expect(findMonorepoRoot(path.join(dir, "packages/a"))?.rootDir).toBe(dir);
  });

  test("a directory the workspaces of the root do not list", () => {
    writeJson("tools/standalone/package.json", { name: "standalone" });
    expect(findMonorepoRoot(path.join(dir, "tools/standalone"))).toBe(
      undefined,
    );
  });

  test("a directory nested in a workspace", () => {
    writeJson("packages/a/package.json", { name: "a" });
    writeJson("packages/a/example/package.json", { name: "example" });
    expect(findMonorepoRoot(path.join(dir, "packages/a/example"))).toBe(
      undefined,
    );
  });

  test("lerna without workspaces: packages/* by default", () => {
    writeJson("package.json", { name: "root", lerna: {} });
    writeJson("packages/a/package.json", { name: "a" });
    expect(findMonorepoRoot(path.join(dir, "packages/a"))?.rootDir).toBe(dir);
  });
});
