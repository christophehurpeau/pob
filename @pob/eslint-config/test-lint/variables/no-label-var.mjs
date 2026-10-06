export function f() {
  // oxlint-disable-next-line no-label-var
  const x = 1;
  // oxlint-disable-next-line eslint-js/no-restricted-syntax, no-labels, no-unused-labels
  x: for (let i = 0; i < 1; i++) {
    if (i) break;
  }
  return x;
}
