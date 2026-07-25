export function f(x) {
  if (typeof x !== "number") {
    // eslint-disable-next-line unicorn/prefer-type-error
    throw new Error("x");
  }
}
