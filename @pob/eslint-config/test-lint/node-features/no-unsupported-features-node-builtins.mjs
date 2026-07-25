// eslint-disable-next-line n/no-unsupported-features/node-builtins
import sqlite from "node:sqlite";

export function open() {
  return sqlite;
}
