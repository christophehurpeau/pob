export function f(a?: number): number {
  // eslint-disable-next-line @typescript-eslint/no-extra-non-null-assertion, @typescript-eslint/no-unnecessary-type-assertion
  return a!!;
}
