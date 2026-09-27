export function f() {
  // oxlint-disable-next-line no-unassigned-vars
  let x;
  // eslint-disable-next-line unicorn/no-typeof-undefined
  return typeof x === "undefined";
}
