export function f(a?: { b: number }): number | undefined {
  // oxlint-disable-next-line typescript/no-non-null-asserted-optional-chain
  return a?.b!;
}
