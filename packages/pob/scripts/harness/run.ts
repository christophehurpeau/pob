/**
 * Differential harness: runs pob on every fixture in a temporary git
 * repository and compares what it changes with the snapshots.
 *
 *   node packages/pob/scripts/harness/run.ts [--converge] [--steps a,b] [--update] [names...]
 *
 * The snapshots are regression snapshots of the pipeline engine. Until
 * 95243aea3 they held the output of the yeoman engine (first run, then what a
 * second run changed), compared by its fixed point. Any run must converge: a
 * second run with --check plans nothing. --converge runs the pipeline engine
 * with --check on the output of a snapshot instead: nothing may change.
 * --update rewrites the snapshots with the output of the pipeline engine,
 * for deliberate changes only (also when the versions of pob-dependencies
 * changed). Snapshots of the old engine still parse (secondRun, config in
 * .yo-rc.json), and known-differences.ts lists the accepted differences with
 * them.
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
import { knownDifferences } from "./known-differences.ts";
import type { HarnessResult } from "./snapshot.ts";
import {
  diffSnapshots,
  fixedPoint,
  parseSnapshot,
  serializeSnapshot,
} from "./snapshot.ts";

const harnessDirectory = import.meta.dirname;
const pobDirectory = path.resolve(harnessDirectory, "../..");
const repositoryRoot = path.resolve(pobDirectory, "../..");
const snapshotsDirectory = path.join(harnessDirectory, "snapshots");
const guardPath = path.join(harnessDirectory, "guard.ts");

const pobEntry = path.join(pobDirectory, "src/index.ts");

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

/**
 * The environment without the variables git hooks set: git would act on the
 * repository of the hook, `git init` would make it bare.
 */
const harnessEnv = (): NodeJS.ProcessEnv => {
  const env = { ...process.env };
  for (const name of ["GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE"]) {
    Reflect.deleteProperty(env, name);
  }
  return env;
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
    {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: harnessEnv(),
    },
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

const guardedEnv = (
  directory: string,
  logPath: string,
): Record<string, string> => ({
  NODE_OPTIONS: `--import ${guardPath}`,
  POB_HARNESS_LOG: logPath,
  POB_HARNESS_ROOT: directory,
});

/** the directory pob runs in */
const pobCwd = (fixture: Fixture, directory: string): string =>
  path.join(directory, fixture.cwd ?? ".");

const keptEffect = (command: string): boolean =>
  !/^(?:node|security|git (?:rev-parse|ls-files|config|remote get-url))\b/.test(
    command,
  );

let selectedSteps: string | undefined;

const runEngine = (
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
  const result = spawnSync(process.execPath, [pobEntry, "update", "from-pob"], {
    cwd: pobCwd(fixture, directory),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 5 * 60 * 1000,
    env: {
      ...harnessEnv(),
      ...guardedEnv(directory, logPath),
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
      // like a checkout: no empty directory is left
      let parent = path.dirname(absolutePath);
      while (parent !== directory && fs.readdirSync(parent).length === 0) {
        fs.rmdirSync(parent);
        parent = path.dirname(parent);
      }
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
    [pobEntry, "update", "--check", "--json"],
    {
      cwd: pobCwd(fixture, directory),
      encoding: "utf8",
      env: {
        ...harnessEnv(),
        ...guardedEnv(
          directory,
          path.join(path.dirname(directory), `${fixture.name}.converge.log`),
        ),
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
const checkSecondRun = (
  fixture: Fixture,
  directory: string,
  result: HarnessResult,
): string[] => {
  if (result.exitCode !== 0 || selectedSteps) return [];
  const check = spawnSync(
    process.execPath,
    [pobEntry, "update", "--check", "--json"],
    {
      cwd: pobCwd(fixture, directory),
      encoding: "utf8",
      env: {
        ...harnessEnv(),
        ...guardedEnv(
          directory,
          path.join(
            path.dirname(directory),
            `${path.basename(directory)}.run2.log`,
          ),
        ),
        POB_STRICT: "1",
      },
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
  const { steps } = await import("../../src/steps/index.ts");
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
  fixture: Fixture,
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
      fixture.cwd,
    ),
  ];
};

const main = async (): Promise<void> => {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      update: { type: "boolean", default: false },
      converge: { type: "boolean", default: false },
      steps: { type: "string" },
    },
  });
  selectedSteps = values.steps;
  stepFilePatterns = selectedSteps
    ? await getStepFilePatterns(selectedSteps.split(","))
    : undefined;

  const selected =
    positionals.length > 0
      ? fixtures.filter((fixture) => positionals.includes(fixture.name))
      : fixtures;
  const runDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "pob-harness-"));
  console.log(`pob harness: ${runDirectory}`);

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
    const result = runEngine(fixture, directory);
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
    const differences = [
      ...(await compareNext(fixture, snapshot, result, initialTree)),
      ...checkSecondRun(fixture, directory, result),
    ];
    const known = selectedSteps ? [] : (knownDifferences[fixture.name] ?? []);
    if (differences.length === 0) {
      console.log(`${fixture.name}: same`);
    } else if (
      differences.length === known.length &&
      differences.every((difference) => known.includes(difference))
    ) {
      console.log(
        `${fixture.name}: ${differences.length} known difference(s), see known-differences.ts`,
      );
    } else {
      failures++;
      console.log(`${fixture.name}: ${differences.length} difference(s)`);
      for (const difference of differences) console.log(`  ${difference}`);
    }
  }

  if (failures > 0) process.exitCode = 1;
};

await main();
