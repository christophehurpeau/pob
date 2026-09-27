export function f(x) {
  if (typeof x !== "number") {
    // oxlint-disable-next-line unicorn/prefer-type-error
    throw new Error("x");
  }
}
