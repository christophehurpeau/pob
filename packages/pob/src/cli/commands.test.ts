import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  onTestFinished,
  test,
  vi,
} from "vitest";
import { createPackage, getNewPackagePath } from "./add.ts";
import { writeInitConfig } from "./init.ts";
import { moveToMonorepo } from "./migrateToMonorepo.ts";
import type { Ask } from "./questions.ts";

let dir: string;

const writeJson = (file: string, value: unknown): void => {
  fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  fs.writeFileSync(path.join(dir, file), JSON.stringify(value));
};

const readJson = (file: string): unknown =>
  JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));

const createAsk =
  (answers: Record<string, unknown>): Ask =>
  (question, defaultValue) => {
    const answer = answers[question.key];
    // an array answers the questions sharing a key, in order
    if (Array.isArray(answer)) return Promise.resolve(answer.shift());
    return Promise.resolve(question.key in answers ? answer : defaultValue);
  };

const author = "A <a@a.a> (https://a.a)";

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "pob-cli-"));
  // no git user, no origin remote: the facts depend on the temp dir only
  vi.stubEnv("GIT_CONFIG_GLOBAL", "/dev/null");
  vi.stubEnv("GIT_CONFIG_NOSYSTEM", "1");
  // set by git hooks (pre-push runs the tests): git would read this repository
  for (const name of ["GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE"]) {
    vi.stubEnv(name, undefined);
  }
});

afterEach(() => {
  vi.unstubAllEnvs();
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("init", () => {
  test("migrates the legacy config and asks the missing keys", async () => {
    writeJson("package.json", {
      name: "my-lib",
      author,
      type: "module",
      license: "MIT",
      repository: "https://github.com/me/my-lib.git",
      pob: { bundler: "tsc", typescript: true },
    });
    writeJson(".yo-rc.json", {
      pob: { project: { type: "lib", packageManager: "npm", ci: true } },
    });
    await writeInitConfig({
      cwd: dir,
      ask: createAsk({ "lib.documentation": false, private: false }),
    });
    expect(readJson("pob.json")).toEqual({
      project: { type: "lib", packageManager: "npm", ci: true },
      build: { bundler: "tsc", typescript: true },
      renovate: { enable: true },
      lib: {
        documentation: false,
        testing: false,
        e2e: false,
        buildInGit: false,
      },
    });
    expect(readJson("package.json")).toMatchObject({ name: "my-lib" });
  });

  test("pob app presets the project type of a new package", async () => {
    await writeInitConfig({
      cwd: dir,
      type: "app",
      ask: createAsk({
        "author.name": "A",
        "author.email": "a@a.a",
        repository: ["github", "me"],
        "app.type": "vite",
      }),
    });
    expect(readJson("pob.json")).toMatchObject({
      project: { type: "app" },
      app: { type: "vite" },
    });
    expect(readJson("package.json")).toEqual({
      name: path.basename(dir),
      private: true,
      author: "A <a@a.a>",
      license: "MIT",
      repository: `https://github.com/me/${path.basename(dir)}.git`,
    });
  });

  test("without a TTY, fails with the missing keys and writes nothing", async () => {
    const { isTTY } = process.stdin;
    process.stdin.isTTY = false;
    onTestFinished(() => {
      process.stdin.isTTY = isTTY;
    });
    writeJson("package.json", { name: "a" });
    await expect(writeInitConfig({ cwd: dir })).rejects.toThrow(
      /Missing pob config, and no TTY to ask for it:\n {2}- pob\.json#project\.type \(lib, app\): set "project\.type" in pob\.json/,
    );
    expect(fs.existsSync(path.join(dir, "pob.json"))).toBe(false);
  });
});

describe("add", () => {
  test("new package path", () => {
    expect(getNewPackagePath(["packages/*"], "@scope/a")).toBe("packages/a");
    expect(getNewPackagePath(["apps/*", "packages/*"], "b")).toBe("apps/b");
  });

  test("--app writes the config without prompts", async () => {
    writeJson("package.json", {
      name: "repo-monorepo",
      private: true,
      author,
      type: "module",
      license: "MIT",
      workspaces: ["packages/*"],
    });
    const ask = vi.fn<Ask>();
    const { packagePath } = await createPackage({
      cwd: dir,
      packageName: "@scope/web",
      app: { type: "vite", testing: true, e2e: false },
      ask,
    });
    expect(packagePath).toBe("packages/web");
    expect(ask).not.toHaveBeenCalled();
    expect(readJson("packages/web/pob.json")).toEqual({
      project: { type: "app" },
      app: { type: "vite", testing: true, e2e: false },
    });
    expect(readJson("packages/web/package.json")).toEqual({
      name: "@scope/web",
      version: "1.0.0-pre",
      private: true,
    });
  });

  test("without --app, asks the package keys only", async () => {
    writeJson("package.json", {
      name: "repo-monorepo",
      author,
      type: "module",
      license: "MIT",
      workspaces: ["packages/*"],
    });
    const asked: string[] = [];
    await createPackage({
      cwd: dir,
      packageName: "lib-a",
      ask: (question, defaultValue) => {
        asked.push(question.key);
        return Promise.resolve(defaultValue);
      },
    });
    expect(asked).toEqual([
      "project.type",
      "private",
      "description",
      "lib.testing",
      "lib.e2e",
      "lib.buildInGit",
      "build.bundler",
    ]);
    expect(readJson("packages/lib-a/pob.json")).toEqual({
      project: { type: "lib" },
      lib: {
        testing: false,
        e2e: false,
        buildInGit: false,
        documentation: false,
      },
      build: {},
    });
  });

  test("fails outside a monorepo or when the package exists", async () => {
    writeJson("package.json", { name: "a" });
    await expect(
      createPackage({ cwd: dir, packageName: "b", ask: createAsk({}) }),
    ).rejects.toThrow("Missing workspaces field");
    writeJson("package.json", { name: "a", workspaces: ["packages/*"] });
    writeJson("packages/b/package.json", { name: "b" });
    await expect(
      createPackage({ cwd: dir, packageName: "b", ask: createAsk({}) }),
    ).rejects.toThrow("packages/b already exists");
  });
});

describe("migrate-to-monorepo", () => {
  test("moves the project and writes the root", async () => {
    writeJson("package.json", {
      name: "my-lib",
      version: "1.2.0",
      author,
      type: "module",
      license: "MIT",
      repository: "https://github.com/me/my-lib.git",
      packageManager: "yarn@4.0.0",
    });
    writeJson(".yo-rc.json", {
      pob: {
        project: { type: "lib", packageManager: "yarn", ci: true },
        renovate: { enable: true },
        lib: { testing: false },
      },
    });
    writeJson("renovate.json", {});
    fs.mkdirSync(path.join(dir, "src"));
    fs.writeFileSync(path.join(dir, "src/index.ts"), "");

    await moveToMonorepo({
      cwd: dir,
      ask: createAsk({ type: "module", "project.yarnNodeLinker": "pnp" }),
    });

    expect(fs.readdirSync(dir).toSorted()).toEqual([
      "package.json",
      "packages",
      "pob.json",
      "renovate.json",
    ]);
    expect(
      fs.readdirSync(path.join(dir, "packages/my-lib")).toSorted(),
    ).toEqual([".yo-rc.json", "package.json", "src"]);
    expect(readJson("package.json")).toEqual({
      private: true,
      name: `${path.basename(dir)}-monorepo`,
      version: "1.2.0",
      author,
      license: "MIT",
      repository: "https://github.com/me/my-lib.git",
      packageManager: "yarn@4.0.0",
      workspaces: ["packages/*"],
      type: "module",
    });
    expect(readJson("pob.json")).toMatchObject({
      project: {
        type: "lib",
        packageManager: "yarn",
        ci: true,
        yarnNodeLinker: "pnp",
      },
      renovate: { enable: true },
      monorepo: { ci: false, typescript: true, eslint: true },
    });
  });

  test("fails on a monorepo", async () => {
    writeJson("package.json", { name: "a", workspaces: ["packages/*"] });
    await expect(moveToMonorepo({ cwd: dir })).rejects.toThrow(
      "workspaces field already exists",
    );
  });
});
