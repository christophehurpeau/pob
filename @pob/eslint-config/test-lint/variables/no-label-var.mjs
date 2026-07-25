export function f() {
  const x = 1;
  // eslint-disable-next-line no-label-var, no-labels, no-restricted-syntax, no-unused-labels
  x: for (let i = 0; i < 1; i++) {
    if (i) break;
  }
  return x;
}
