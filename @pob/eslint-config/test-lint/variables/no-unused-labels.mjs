export function f(arr) {
  // oxlint-disable-next-line eslint-js/no-restricted-syntax, no-unused-labels, no-labels
  loop: for (const item of arr) {
    if (item) {
      break;
    }
  }
}
