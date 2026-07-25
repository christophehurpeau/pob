// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
export function f<T extends any>(x: T): T {
  return x;
}
