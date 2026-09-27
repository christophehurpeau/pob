export function f(a: number | undefined, b: number): boolean {
  // oxlint-disable-next-line typescript/no-confusing-non-null-assertion, eqeqeq
  return a! == b;
}
