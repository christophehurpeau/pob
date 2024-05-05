#!/usr/bin/env node

import fs from "node:fs";
import { override } from "../lib/index.js";

const paths = process.argv.slice(2);
const pkg = fs.readFileSync("package.json", "utf8");

if (paths.length === 0) {
  paths.push(".eslintrc.json");
}

await paths.map((path) => {
  return override(path, pkg.prettier);
});
