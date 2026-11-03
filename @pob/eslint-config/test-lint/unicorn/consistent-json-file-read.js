/* global p */
import fs from "node:fs";

// oxlint-disable-next-line unicorn-js/consistent-json-file-read
export const x = JSON.parse(fs.readFileSync(p));
