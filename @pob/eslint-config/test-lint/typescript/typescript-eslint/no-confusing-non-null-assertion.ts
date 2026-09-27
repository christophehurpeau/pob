export function f(a: number | undefined, b: number): boolean {
  /* eslint-disable-next-line eqeqeq */ // oxlint-disable-next-line typescript/no-confusing-non-null-assertion
  return a! == b;
}
