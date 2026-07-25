export function f(a?: { b: number }): number | undefined {
  // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
  return a?.b!;
}
