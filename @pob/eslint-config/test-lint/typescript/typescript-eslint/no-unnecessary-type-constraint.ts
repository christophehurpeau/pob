// oxlint-disable-next-line typescript/no-unnecessary-type-constraint
export function f<T extends any>(x: T): T {
  return x;
}
