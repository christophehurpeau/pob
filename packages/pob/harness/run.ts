/**
 * Differential harness: runs pob on every fixture in a temporary git
 * repository and snapshots what it changes.
 *
 *   node packages/pob/harness/run.ts [--engine old|next] [--update] [names...]
 *
 * --engine old (default) runs the yeoman engine, --engine next the pipeline
 * engine. With --update, the snapshots are rewritten; otherwise the result is
 * compared to them and the command exits with 1 on a difference.
 */
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";
import type { Fixture } from "./fixtures.ts";
import { fixtures } from "./fixtures.ts";
import type { HarnessResult } from "./snapshot.ts";
import { diffSnapshots, parseSnapshot, serializeSnapshot } from "./snapshot.ts";

type Engine = "old" | "next";

const harnessDirectory = import.meta.dirname;
const pobDirectory = path.dirname(harnessDirectory);
const repositoryRoot = path.resolve(pobDirectory, "../..");
const snapshotsDirectory = path.join(harnessDirectory, "snapshots");
const guardPath = path.join(harnessDirectory, "guard.ts");

const engineEntries: Record<Engine, string[]> = {
  old: [path.join(pobDirectory, "lib/pob.js"), "update", "from-pob", "--force"],
  next: [path.join(pobDirectory, "src/cli.ts"), "update", "from-pob"],
};

const ignoredDirectories = new Set([".git", "node_modules"]);

const readTree = (root: string): Map<string, string> => {
  const tree = new Map<string, string>();
  const walk = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!ignoredDirectories.has(entry.name)) walk(absolutePath);
      } else if (entry.isFile()) {
        tree.set(
          path.relative(root, absolutePath),
          fs.readFileSync(absolutePath, "utf8"),
        );
      }
    }
  };
  walk(root);
  return tree;
};

const git = (cwd: string, args: string[]): string =>
  execFileSync(
    "git",
    [
      "-c",
      "user.name=pob harness",
      "-c",
      "user.email=harness@example.invalid",
      "-c",
      "core.hooksPath=/dev/null",
      "-c",
      "commit.gpgsign=false",
      ...args,
    ],
    { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );

const createFixture = (fixture: Fixture, directory: string): void => {
  fs.mkdirSync(directory, { recursive: true });
  if (fixture.gitArchive) {
    const archive = execFileSync("git", ["archive", fixture.gitArchive], {
      cwd: repositoryRoot,
      maxBuffer: 512 * 1024 * 1024,
    });
    execFileSync("tar", ["-x", "-C", directory], { input: archive });
  }
  for (const [filePath, content] of Object.entries(fixture.files)) {
    const absolutePath = path.join(directory, filePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, content);
  }
  git(directory, ["init", "--quiet", "--initial-branch=main"]);
  const remote =
    fixture.remote === undefined
      ? `https://github.com/pob-harness/${fixture.name}.git`
      : fixture.remote;
  if (remote) git(directory, ["remote", "add", "origin", remote]);
  git(directory, ["add", "--all", "."]);
  git(directory, ["commit", "--quiet", "--no-verify", "-m", "fixture"]);
};

const keptEffect = (command: string): boolean =>
  !/^(?:node|security|git (?:rev-parse|ls-files|config|remote get-url))\b/.test(
    command,
  );

const runEngine = (
  engine: Engine,
  fixture: Fixture,
  directory: string,
): HarnessResult => {
  const before = readTree(directory);
  const logPath = path.join(path.dirname(directory), `${fixture.name}.log`);
  const outputPath = path.join(
    path.dirname(directory),
    `${fixture.name}.output.txt`,
  );
  const result = spawnSync(process.execPath, engineEntries[engine], {
    cwd: directory,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 5 * 60 * 1000,
    env: {
      ...process.env,
      NODE_OPTIONS: `--import ${guardPath}`,
      POB_HARNESS_LOG: logPath,
      POB_HARNESS_ROOT: directory,
      CI: "true",
      TZ: "UTC",
      FORCE_COLOR: "0",
      NO_COLOR: "1",
    },
  });
  fs.writeFileSync(outputPath, `${result.stdout}\n${result.stderr}`);
  const after = readTree(directory);

  const files: HarnessResult["files"] = [];
  for (const [filePath, content] of after) {
    const previous = before.get(filePath);
    if (previous === undefined) {
      files.push({ path: filePath, status: "created", content });
    } else if (previous !== content) {
      files.push({ path: filePath, status: "modified", content });
    }
  }
  for (const filePath of before.keys()) {
    if (!after.has(filePath)) files.push({ path: filePath, status: "deleted" });
  }
  files.sort((a, b) => a.path.localeCompare(b.path, "en"));

  const removedFromIndex = git(directory, [
    "diff",
    "--cached",
    "--name-only",
    "--diff-filter=D",
  ])
    .split("\n")
    .filter(Boolean)
    .toSorted((a, b) => a.localeCompare(b, "en"));

  const effects = fs.existsSync(logPath)
    ? fs
        .readFileSync(logPath, "utf8")
        .split("\n")
        .filter(Boolean)
        .map(
          (line) =>
            JSON.parse(line) as {
              cwd: string;
              command: string;
              blocked: boolean;
            },
        )
        .filter(({ command }) => keptEffect(command))
        .map(
          ({ cwd, command, blocked }) =>
            `${blocked ? "[blocked] " : ""}(${cwd}) ${command}`,
        )
    : [];

  return {
    fixture: fixture.name,
    exitCode: result.status ?? -1,
    effects,
    removedFromIndex,
    files,
  };
};

const main = (): void => {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      engine: { type: "string", default: "old" },
      update: { type: "boolean", default: false },
    },
  });
  const engine = values.engine as Engine;
  if (!(engine in engineEntries)) throw new Error(`Unknown engine ${engine}`);

  const selected =
    positionals.length > 0
      ? fixtures.filter((fixture) => positionals.includes(fixture.name))
      : fixtures;
  const runDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), `pob-harness-${engine}-`),
  );
  console.log(`pob harness (${engine}): ${runDirectory}`);

  let failures = 0;
  for (const fixture of selected) {
    const directory = path.join(runDirectory, fixture.name);
    createFixture(fixture, directory);
    const result = runEngine(engine, fixture, directory);
    const serialized = serializeSnapshot(result);
    const snapshotPath = path.join(snapshotsDirectory, `${fixture.name}.snap`);

    if (values.update) {
      fs.mkdirSync(snapshotsDirectory, { recursive: true });
      fs.writeFileSync(snapshotPath, serialized);
      console.log(
        `${fixture.name}: exit ${result.exitCode}, ${result.files.length} file(s), ${result.effects.length} effect(s)`,
      );
      continue;
    }

    fs.writeFileSync(
      path.join(runDirectory, `${fixture.name}.actual.snap`),
      serialized,
    );
    if (!fs.existsSync(snapshotPath)) {
      failures++;
      console.log(`${fixture.name}: missing snapshot`);
      continue;
    }
    const differences = diffSnapshots(
      parseSnapshot(fs.readFileSync(snapshotPath, "utf8")),
      result,
    );
    if (differences.length === 0) {
      console.log(`${fixture.name}: same`);
    } else {
      failures++;
      console.log(`${fixture.name}: ${differences.length} difference(s)`);
      for (const difference of differences) console.log(`  ${difference}`);
    }
  }

  if (failures > 0) process.exitCode = 1;
};

main();
