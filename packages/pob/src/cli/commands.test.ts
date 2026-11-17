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
import { appTypes } from "./questions.ts";
import { runUpdatePipeline } from "./update.ts";

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

  const writeMonorepoRoot = (): void => {
    writeJson("package.json", {
      name: "repo-monorepo",
      private: true,
      author,
      type: "module",
      license: "MIT",
      repository: "https://github.com/me/repo.git",
      workspaces: ["packages/*"],
    });
    writeJson("pob.json", {
      project: { type: "lib", packageManager: "yarn", ci: false },
      monorepo: { eslint: true, typescript: false },
      renovate: { enable: true },
    });
  };

  test.each(appTypes)(
    "--app %s writes a config the update accepts, without prompts",
    async (type) => {
      const { isTTY } = process.stdin;
      process.stdin.isTTY = false;
      onTestFinished(() => {
        process.stdin.isTTY = isTTY;
      });
      writeMonorepoRoot();
      const ask = vi.fn<Ask>();
      const { packagePath } = await createPackage({
        cwd: dir,
        packageName: "app",
        app: { type, testing: false, e2e: false },
        ask,
      });
      expect(ask).not.toHaveBeenCalled();
      const transpiled = ["node", "node-library", "alp-node"].includes(type);
      expect(readJson(`${packagePath}/pob.json`)).toEqual({
        project: { type: "app" },
        app: { type, testing: false, e2e: false },
        ...(transpiled ? { build: {} } : {}),
      });
      const update = runUpdatePipeline({
        cwd: dir,
        check: true,
        fromPob: true,
      });
      await (type === "next.js"
        ? expect(update).rejects.toThrow("nextjs has been removed")
        : expect(update).resolves.toBeDefined());
    },
  );

  test("without a TTY, accepts a directory holding only the missing config", async () => {
    const { isTTY } = process.stdin;
    process.stdin.isTTY = false;
    onTestFinished(() => {
      process.stdin.isTTY = isTTY;
    });
    writeJson("package.json", {
      name: "repo-monorepo",
      private: true,
      type: "module",
      license: "MIT",
      workspaces: ["packages/*"],
    });
    const error = await createPackage({ cwd: dir, packageName: "lib-a" }).then(
      () => undefined,
      (error: unknown) => error as Error,
    );
    expect(error?.message).toContain(
      'set "project.type" in packages/lib-a/pob.json',
    );
    expect(error?.message).toContain(
      "then run pob add lib-a again: it keeps packages/lib-a/pob.json and packages/lib-a/package.json",
    );
    expect(fs.existsSync(path.join(dir, "packages/lib-a"))).toBe(false);

    writeJson("packages/lib-a/pob.json", {
      project: { type: "lib" },
      lib: { testing: false, e2e: false },
      build: {},
    });
    writeJson("packages/lib-a/package.json", {
      author: "B <b@b.b>",
      description: "desc",
    });
    await createPackage({ cwd: dir, packageName: "lib-a" });
    expect(readJson("packages/lib-a/pob.json")).toEqual({
      project: { type: "lib" },
      lib: { testing: false, e2e: false, documentation: false },
      build: {},
    });
    expect(readJson("packages/lib-a/package.json")).toEqual({
      name: "lib-a",
      version: "1.0.0-pre",
      author: "B <b@b.b>",
      description: "desc",
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
    fs.writeFileSync(path.join(dir, "packages/b/index.js"), "");
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

  test("a scoped package goes to packages/<name>, the pnpm files stay at the root", async () => {
    writeJson("package.json", {
      name: "@scope/my-lib",
      version: "1.2.0",
      author,
      type: "module",
      license: "MIT",
      repository: "https://github.com/me/my-lib.git",
      packageManager: "pnpm@10.0.0",
    });
    writeJson("pob.json", {
      project: { type: "lib", packageManager: "pnpm", ci: false },
      renovate: { enable: true },
      lib: { testing: false },
    });
    fs.writeFileSync(
      path.join(dir, "pnpm-workspace.yaml"),
      "patchedDependencies:\n  a: patches/a.patch\n",
    );
    fs.writeFileSync(path.join(dir, ".npmrc"), "registry=https://r.example\n");
    fs.mkdirSync(path.join(dir, "patches"));
    fs.writeFileSync(path.join(dir, "patches/a.patch"), "");
    fs.mkdirSync(path.join(dir, "src"));

    await moveToMonorepo({ cwd: dir, ask: createAsk({}) });

    expect(fs.readdirSync(dir).toSorted()).toEqual([
      ".npmrc",
      "package.json",
      "packages",
      "patches",
      "pnpm-workspace.yaml",
      "pob.json",
    ]);
    expect(
      fs.readdirSync(path.join(dir, "packages/my-lib")).toSorted(),
    ).toEqual(["package.json", "pob.json", "src"]);
  });

  test("fails on a monorepo", async () => {
    writeJson("package.json", { name: "a", workspaces: ["packages/*"] });
    await expect(moveToMonorepo({ cwd: dir })).rejects.toThrow(
      "workspaces field already exists",
    );
  });
});
