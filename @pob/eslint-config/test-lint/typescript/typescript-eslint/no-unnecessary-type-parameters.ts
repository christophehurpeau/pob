// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function f<T>(x: T): void {
  globalThis.String(x);
}
