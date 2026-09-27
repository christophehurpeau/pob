export function f(arr) {
  /* eslint-disable-next-line no-restricted-syntax */ // oxlint-disable-next-line no-unused-labels, no-labels
  loop: for (const item of arr) {
    if (item) {
      break;
    }
  }
}
