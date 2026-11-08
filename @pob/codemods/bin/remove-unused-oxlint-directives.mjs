#!/usr/bin/env node

import { runRemoveUnusedOxlintDirectives } from "../lib/removeUnusedOxlintDirectives.js";

const files = runRemoveUnusedOxlintDirectives({ args: process.argv.slice(2) });
for (const file of files) console.log(file);
console.log(`Done! ${files.length} file(s) updated.`);
