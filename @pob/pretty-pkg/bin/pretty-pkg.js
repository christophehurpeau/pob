#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { glob } from "glob";
import { overrideSync, writeSync } from "../lib/index.js";

const packageJsonPathnames = process.argv.slice(2);

if (packageJsonPathnames.length > 0) {
  packageJsonPathnames.forEach((packageJsonPathname) => {
    overrideSync(packageJsonPathname);
  });
} else {
  const pkg = JSON.parse(fs.readFileSync("package.json"));
  writeSync(pkg, "package.json");

  if (pkg.workspaces && pkg.workspaces.length > 0) {
    const patterns = pkg.workspaces;

    const getGlobPattern = (pattern) =>
      pattern.endsWith("/") ? pattern : `${pattern}/`;

    for (const pattern of patterns) {
      const matches = await glob(getGlobPattern(pattern), {
        ignore: ["**/node_modules/**"],
      });

      for (const match of matches) {
        const packageJsonPathname = path.join(match, "package.json");
        if (fs.existsSync(packageJsonPathname)) {
          overrideSync(packageJsonPathname);
        }
      }
    }
  }
}
