import assert from "node:assert";

export function f(x) {
  // oxlint-disable-next-line unicorn/consistent-assert
  assert(x);
}
