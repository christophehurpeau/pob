export function f(a?: number): number {
  // oxlint-disable-next-line typescript/no-extra-non-null-assertion, typescript/no-unnecessary-type-assertion
  return a!!;
}
