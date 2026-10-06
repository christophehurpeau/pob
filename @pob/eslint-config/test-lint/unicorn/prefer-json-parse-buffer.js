/* global p */
import fs from "node:fs";

// oxlint-disable-next-line unicorn-js/prefer-json-parse-buffer
export const x = JSON.parse(fs.readFileSync(p, "utf8"));
