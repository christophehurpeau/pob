/** Dependencies without type declarations, typed with what pob uses. */
import { createRequire } from "node:module";

export interface ParsedAuthor {
  name?: string;
  email?: string;
  url?: string;
}

const require = createRequire(import.meta.url);

export const parseAuthor = require("parse-author") as (
  author: string,
) => ParsedAuthor;

export const camelCase = require("lodash.camelcase") as (
  value: string,
) => string;
