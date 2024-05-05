#!/usr/bin/env node

import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { glob } from "glob";
import runJscodeshift from "../lib/runJscodeshift.cjs";

const argv = process.argv.slice(2);

const transformerName = argv[0];
const globPaths = argv[1];

if (!transformerName || !globPaths) {
  const transformerList = readdirSync(
    new URL("../lib/transforms/", import.meta.url),
  );
  throw new Error(
    `Usage: pob-migrate <transformer-name> <glob-paths>\n${transformerList
      .map((t) => `- "${t.slice(0, -4)}"`)
      .join("\n")}`,
  );
}

const transformPath = fileURLToPath(
  new URL(`../lib/transforms/${transformerName}.cjs`, import.meta.url),
);
const paths = glob.sync(globPaths);

if (paths.length === 0) {
  throw new Error(`No files found matching ${globPaths}`);
}

const res = await runJscodeshift(transformPath, paths, {});
if (res.errors) {
  process.exitCode = 1;
}
console.log("Done!");
