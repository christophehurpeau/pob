#!/usr/bin/env node

import fs from "node:fs";
import { overrideSync } from "../lib/index.js";

const paths = process.argv.slice(2);
const pkg = fs.readFileSync("package.json", "utf8");

if (paths.length === 0) {
  paths.push(".eslintrc.json");
}

paths.forEach((path) => {
  overrideSync(path, pkg.prettier);
});
