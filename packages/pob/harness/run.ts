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
import {
  applyResult,
  comparePobJson,
  normalizeConfigMigration,
} from "./configMigration.ts";
import type { Fixture } from "./fixtures.ts";
import { fixtures } from "./fixtures.ts";
import type { HarnessResult } from "./snapshot.ts";
import {
  diffSnapshots,
  fixedPoint,
  parseSnapshot,
  serializeSnapshot,
} from "./snapshot.ts";

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

let selectedSteps: string | undefined;

const runEngine = (
  engine: Engine,
  fixture: Fixture,
  directory: string,
  runName = "run1",
): HarnessResult => {
  const before = readTree(directory);
  const logPath = path.join(
    path.dirname(directory),
    `${fixture.name}.${runName}.log`,
  );
  const outputPath = path.join(
    path.dirname(directory),
    `${fixture.name}.${runName}.output.txt`,
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
      POB_STRICT: "1",
      ...(selectedSteps ? { POB_STEPS: selectedSteps } : {}),
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
    secondRun: [],
  };
};

/** First run, then the changes of a second run on its committed output. */
const runOldTwice = (fixture: Fixture, directory: string): HarnessResult => {
  const first = runEngine("old", fixture, directory);
  if (first.exitCode !== 0) return first;
  git(directory, ["add", "--all", "."]);
  git(directory, ["commit", "--quiet", "--no-verify", "-m", "old pob run 1"]);
  const second = runEngine("old", fixture, directory, "run2");
  return { ...first, secondRun: second.files };
};

interface PlanJson {
  files: {
    path: string;
    op: string;
    before?: string;
    after?: string;
    transient?: boolean;
  }[];
  effects: { id: string; cwd: string; command?: string }[];
  warnings: string[];
}

const configFileNames = new Set([".yo-rc.json", ".pob.json", "pob.json"]);

/** The move of the config to pob.json: compared by the full mode */
const isConfigMigrationOnly = (file: PlanJson["files"][number]): boolean => {
  const name = path.posix.basename(file.path);
  if (configFileNames.has(name)) return true;
  if (name !== "package.json" || file.op !== "modify") return false;
  const withoutPob = (content = "{}"): string => {
    const { pob: _, ...pkg } = JSON.parse(content) as Record<string, unknown>;
    return JSON.stringify(pkg);
  };
  return withoutPob(file.before) === withoutPob(file.after);
};

const applySnapshot = (directory: string, snapshot: HarnessResult): void => {
  for (const file of [...snapshot.files, ...snapshot.secondRun]) {
    const absolutePath = path.join(directory, file.path);
    if (file.status === "deleted") {
      fs.rmSync(absolutePath, { force: true });
    } else {
      fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
      fs.writeFileSync(absolutePath, file.content ?? "");
    }
  }
  git(directory, ["add", "--all", "."]);
  git(directory, ["commit", "--quiet", "--no-verify", "-m", "old pob output"]);
};

const firstChangedLine = (before = "", after = ""): string => {
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  const index = afterLines.findIndex((line, i) => line !== beforeLines[i]);
  if (index === -1) return "";
  return ` line ${index + 1}: ${JSON.stringify(beforeLines[index])} -> ${JSON.stringify(afterLines[index])}`;
};

/**
 * Runs the pipeline engine with --check on the output of the old engine: the
 * steps already ported must not change anything.
 */
const runConverge = (
  fixture: Fixture,
  directory: string,
  steps: string | undefined,
): string[] | undefined => {
  const snapshotPath = path.join(snapshotsDirectory, `${fixture.name}.snap`);
  const snapshot = parseSnapshot(fs.readFileSync(snapshotPath, "utf8"));
  if (snapshot.exitCode !== 0) return undefined;
  applySnapshot(directory, snapshot);
  const result = spawnSync(
    process.execPath,
    [path.join(pobDirectory, "src/cli.ts"), "update", "--check", "--json"],
    {
      cwd: directory,
      encoding: "utf8",
      env: {
        ...process.env,
        POB_STRICT: "1",
        ...(steps ? { POB_STEPS: steps } : {}),
      },
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  if (!result.stdout.trim().startsWith("{")) {
    return [
      `engine failed: ${result.stderr.trim().split("\n").slice(0, 8).join("\n    ")}`,
    ];
  }
  const plan = JSON.parse(result.stdout) as PlanJson;
  return [
    ...plan.files
      .filter((file) => !isConfigMigrationOnly(file))
      .map(
        (file) =>
          `${file.op} ${file.path}${file.op === "modify" ? firstChangedLine(file.before, file.after) : ""}`,
      ),
    ...plan.warnings.map((warning) => `warning: ${warning}`),
  ];
};

/** The new engine must converge in one run: a second run plans nothing. */
const checkSecondRun = (directory: string, result: HarnessResult): string[] => {
  if (result.exitCode !== 0 || selectedSteps) return [];
  const check = spawnSync(
    process.execPath,
    [path.join(pobDirectory, "src/cli.ts"), "update", "--check", "--json"],
    {
      cwd: directory,
      encoding: "utf8",
      env: { ...process.env, POB_STRICT: "1" },
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  if (!check.stdout.trim().startsWith("{")) {
    return [`second run failed: ${check.stderr.trim().split("\n")[0] ?? ""}`];
  }
  const plan = JSON.parse(check.stdout) as PlanJson;
  return plan.files
    .filter((file) => !file.transient)
    .map(
      (file) =>
        `second run: ${file.op} ${file.path}${file.op === "modify" ? firstChangedLine(file.before, file.after) : ""}`,
    );
};

let stepFilePatterns: RegExp[] | undefined;

/** `files:` patterns written by the selected steps, as regexps */
const getStepFilePatterns = async (names: string[]): Promise<RegExp[]> => {
  const { steps } = await import("../src/steps/index.ts");
  return steps
    .filter((step) => names.includes(step.name))
    .flatMap((step) => step.writes)
    .filter((pattern) => pattern.startsWith("files:"))
    .map(
      (pattern) =>
        new RegExp(
          `^${pattern
            .slice("files:".length)
            .replaceAll(/[$()+.?[\\\]^{|}]/g, String.raw`\$&`)
            .replaceAll("**", "\0")
            .replaceAll("*", "[^/]*")
            .replaceAll("\0", ".*")}$`,
        ),
    );
};

/**
 * With --steps, only the files written by these steps are compared:
 * package.json is also written by the steps not ported yet.
 */
const restrictToSteps = (
  result: HarnessResult,
  initialTree: ReadonlyMap<string, string>,
): HarnessResult => {
  const patterns = stepFilePatterns;
  if (!patterns) return result;
  const packageRoots = [...initialTree.keys()]
    .filter((filePath) => path.posix.basename(filePath) === "package.json")
    .map((filePath) => {
      const directory = path.posix.dirname(filePath);
      return directory === "." ? "" : `${directory}/`;
    });
  const isWrittenBySteps = (filePath: string): boolean =>
    packageRoots.some(
      (root) =>
        filePath.startsWith(root) &&
        patterns.some((pattern) => pattern.test(filePath.slice(root.length))),
    );
  return {
    ...result,
    effects: [],
    removedFromIndex: [],
    files: result.files.filter((file) => isWrittenBySteps(file.path)),
  };
};

/**
 * The new engine against the fixed point of the old one, the config migration
 * to pob.json compared apart.
 */
const compareNext = async (
  snapshot: HarnessResult,
  result: HarnessResult,
  initialTree: ReadonlyMap<string, string>,
): Promise<string[]> => {
  const expected = fixedPoint(snapshot, initialTree);
  const differences = diffSnapshots(
    restrictToSteps(
      await normalizeConfigMigration(expected, initialTree),
      initialTree,
    ),
    restrictToSteps(
      await normalizeConfigMigration(result, initialTree),
      initialTree,
    ),
  );
  if (stepFilePatterns || result.exitCode !== 0 || expected.exitCode !== 0) {
    return differences;
  }
  return [
    ...differences,
    ...comparePobJson(
      applyResult(initialTree, expected),
      applyResult(initialTree, result),
    ),
  ];
};

const main = async (): Promise<void> => {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      engine: { type: "string", default: "old" },
      update: { type: "boolean", default: false },
      converge: { type: "boolean", default: false },
      steps: { type: "string" },
    },
  });
  const engine = values.engine as Engine;
  selectedSteps = values.steps;
  stepFilePatterns = selectedSteps
    ? await getStepFilePatterns(selectedSteps.split(","))
    : undefined;
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
    if (values.converge) {
      const differences = runConverge(fixture, directory, values.steps);
      if (differences === undefined) {
        console.log(`${fixture.name}: skipped, the old engine failed on it`);
      } else if (differences.length === 0) {
        console.log(`${fixture.name}: converged`);
      } else {
        failures++;
        console.log(`${fixture.name}: ${differences.length} change(s)`);
        for (const difference of differences) console.log(`  ${difference}`);
      }
      continue;
    }
    const initialTree = readTree(directory);
    const result =
      engine === "old"
        ? runOldTwice(fixture, directory)
        : runEngine(engine, fixture, directory);
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
    const snapshot = parseSnapshot(fs.readFileSync(snapshotPath, "utf8"));
    const differences =
      engine === "old"
        ? [
            ...diffSnapshots(snapshot, result),
            ...diffSnapshots(
              { ...snapshot, files: snapshot.secondRun },
              { ...result, files: result.secondRun },
            ).map((difference) => `second run: ${difference}`),
          ]
        : [
            ...(await compareNext(snapshot, result, initialTree)),
            ...checkSecondRun(directory, result),
          ];
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

await main();
