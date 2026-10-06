// oxlint-disable-next-line node-js/no-unsupported-features/node-builtins
import sqlite from "node:sqlite";

export function open() {
  return sqlite;
}
