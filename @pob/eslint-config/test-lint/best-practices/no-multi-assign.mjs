export function f() {
  // oxlint-disable-next-line prefer-const
  let a;
  // oxlint-disable-next-line prefer-const
  let b;
  // oxlint-disable-next-line no-multi-assign
  a = b = 1;
  return a + b;
}
