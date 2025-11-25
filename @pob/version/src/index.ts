import fs from "node:fs";
import { program } from "commander";

import "./commands/version.ts";

// relative to dist directory
const pkg = JSON.parse(
  // eslint-disable-next-line unicorn/prefer-json-parse-buffer
  fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

program.name(pkg.name).description(pkg.description).version(pkg.version);
program.parse();
