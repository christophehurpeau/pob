/* global p */
import fs from "node:fs";

// eslint-disable-next-line unicorn/prefer-json-parse-buffer
export const x = JSON.parse(fs.readFileSync(p, "utf8"));
