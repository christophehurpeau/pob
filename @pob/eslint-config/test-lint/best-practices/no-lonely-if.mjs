export function f(a, b) {
  if (a) {
    return 1;
  } else {
    // eslint-disable-next-line no-lonely-if
    if (b) {
      return 2;
    }
  }
  return 3;
}
