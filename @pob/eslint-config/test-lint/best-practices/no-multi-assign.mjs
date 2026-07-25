export function f() {
  let a;
  let b;
  // eslint-disable-next-line no-multi-assign, prefer-const
  a = b = 1;
  return a + b;
}
