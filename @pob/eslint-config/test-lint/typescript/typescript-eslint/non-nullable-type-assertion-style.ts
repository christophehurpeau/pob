export function f(a: string | null): string {
  // eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
  return a as string;
}
