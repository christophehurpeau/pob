export function f(a: string | null): string {
  // oxlint-disable-next-line typescript/non-nullable-type-assertion-style
  return a as string;
}
