export function f(a, x) {
  const index = a.indexOf(x);
  // oxlint-disable-next-line unicorn/consistent-existence-index-check
  if (index > -1) {
    return index;
  }
  return 0;
}
