export function f(a: number | undefined, b: number): boolean {
  // eslint-disable-next-line @typescript-eslint/no-confusing-non-null-assertion, eqeqeq
  return a! == b;
}
