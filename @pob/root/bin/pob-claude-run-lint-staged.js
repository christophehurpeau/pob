#!/usr/bin/env node

/**
 * PostToolUse hook: runs lint-staged commands immediately on the edited file.
 * Uses lint-staged.config.js as single source of truth.
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import picomatch from "picomatch";

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const raw = chunks.join("");
if (!raw) {
  process.stderr.write("No input received\n");
  process.exit(1);
}
const input = JSON.parse(raw);

const file = input.tool_input?.file_path;
const cwd = input.cwd;
if (!file || !cwd) process.exit(0);

const relFile = path.relative(cwd, file);

// chdir before importing the config so path.resolve("package.json") and
// whichPmRuns()'s lockfile detection both resolve against the project root.
process.chdir(cwd);

const configPath = path.join(cwd, "lint-staged.config.js");
if (!existsSync(configPath)) process.exit(0);

const { default: config } = await import(pathToFileURL(configPath).href);

// Skip commands that are too slow for per-file runs or that have undesirable side-effects.
const SKIP = [
  "git add", // side effects during agent execution
  "tsc", // too slow per-file (matches "tsc" and "tsc -b")
  "rollup", // too slow per-file
  "yarn", // package manager install/dedupe
  "pnpm", // package manager install/dedupe
  "npm", // package manager install/dedupe
  "bun", // package manager install/dedupe
];

const shouldSkip = (cmd) =>
  SKIP.some((s) => cmd === s || cmd.startsWith(`${s} `));

let hasError = false;

for (const [pattern, commandFnOrArray] of Object.entries(config)) {
  // Replicate lint-staged matchBase: patterns without "/" match on basename only.
  const matchBase = !pattern.includes("/");
  if (!picomatch.isMatch(relFile, pattern, { matchBase })) continue;

  // Function tasks generate their own commands and get no filename appended,
  // arrays are sequential tasks and nested arrays parallel ones.
  const resolveCommands = (command) => {
    if (typeof command === "function") {
      const result = command([file]);
      return Array.isArray(result) ? result : [result];
    }
    if (Array.isArray(command)) return command.flatMap(resolveCommands);
    return [`${command} ${JSON.stringify(file)}`];
  };

  const commands = resolveCommands(commandFnOrArray);

  for (const cmd of commands.filter(Boolean)) {
    if (shouldSkip(cmd)) continue;

    const result = spawnSync(cmd, {
      cwd,
      shell: true,
      stdio: "pipe",
      env: {
        ...process.env,
        PATH: `${cwd}/node_modules/.bin:${process.env.PATH}`,
      },
    });

    if (result.status !== 0) {
      hasError = true;
      const out = result.stdout?.toString().trim();
      const err = result.stderr?.toString().trim();
      if (out) process.stderr.write(`${out}\n`);
      if (err) process.stderr.write(`${err}\n`);
    }
  }
}

// Exit 2 so Claude sees errors and fixes them before continuing.
process.exit(hasError ? 2 : 0);
