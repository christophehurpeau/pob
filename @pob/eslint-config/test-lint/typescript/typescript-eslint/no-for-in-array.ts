export function f(arr: number[]): void {
  /* eslint-disable-next-line guard-for-in, no-restricted-syntax */ // oxlint-disable-next-line typescript/no-for-in-array
  for (const i in arr) {
    globalThis.String(arr[i]);
  }
}
