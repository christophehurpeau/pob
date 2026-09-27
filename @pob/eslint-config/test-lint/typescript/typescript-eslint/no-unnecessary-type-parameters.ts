// oxlint-disable-next-line typescript/no-unnecessary-type-parameters
export function f<T>(x: T): void {
  globalThis.String(x);
}
