import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, expect, test } from "vitest";
import { createDiskFiles } from "./files.ts";

let dir: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "pob-files-"));
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

test("isExecutable reads the mode of a file on disk", () => {
  fs.writeFileSync(path.join(dir, "script"), "#!/bin/sh\n", { mode: 0o755 });
  fs.writeFileSync(path.join(dir, "file"), "", { mode: 0o644 });
  fs.mkdirSync(path.join(dir, "directory"), { mode: 0o755 });
  const files = createDiskFiles(dir);
  expect(files.isExecutable("script")).toBe(true);
  expect(files.isExecutable("file")).toBe(false);
  expect(files.isExecutable("directory")).toBe(false);
  expect(files.isExecutable("missing")).toBe(false);
});
