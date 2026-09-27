/* eslint-disable no-undef */

export function foo() {
  return true;
  // oxlint-disable-next-line no-unreachable
  log("done");
}
