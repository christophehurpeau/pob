/* eslint-disable no-undef */

export function foo() {
  return true;
  // eslint-disable-next-line no-unreachable
  log("done");
}
