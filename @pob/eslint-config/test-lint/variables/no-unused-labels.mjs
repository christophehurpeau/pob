export function f(arr) {
  // eslint-disable-next-line no-unused-labels, no-labels, no-restricted-syntax
  loop: for (const item of arr) {
    if (item) {
      break;
    }
  }
}
