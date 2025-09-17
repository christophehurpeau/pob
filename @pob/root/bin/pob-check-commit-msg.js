#!/usr/bin/env node

import { execSync } from "node:child_process";
import fs from "node:fs";
import { formatResult } from "@commitlint/format";
import lint from "@commitlint/lint";
import commitlintConfig from "../lib/commitlint-config.js";

const argv = process.argv.slice(2);
const filePath = argv[0];

if (!filePath) {
  console.error("No file path provided");
  process.exit(1);
}

const content = fs.readFileSync(filePath, "utf8");

if (!content) {
  console.error("No content provided");
  process.exit(1);
}

const parserOpts = commitlintConfig.parserPreset.parser;
const opts = {
  parserOpts: parserOpts || {},
  plugins: commitlintConfig.plugins || [],
  ignores: commitlintConfig.ignores || [],
  defaultIgnores: commitlintConfig.defaultIgnores || [],
};

let commentChar = "#";
try {
  commentChar =
    execSync("git config core.commentChar", { encoding: "utf8" }).trim() || "#";
} catch {
  // git not available or config not set, use default
}
opts.parserOpts.commentChar = commentChar;

const result = await lint(content, commitlintConfig.rules, opts);

if (result.errors.length > 0) {
  console.error("Error: Invalid commit message");
  console.error(formatResult(result).join("\n"));
  process.exit(1);
}
