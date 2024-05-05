#!/usr/bin/env node

import { execSync } from "node:child_process";

try {
  const stdout = execSync("git status --porcelain", { encoding: "utf8" });
  if (stdout) {
    console.log(
      "Repository has uncommitted changes, please commit or remove these files:\n",
    );
    console.log(stdout);
    process.exit(1);
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
