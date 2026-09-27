export function f(arr: number[]): void {
  /* eslint-disable-next-line no-restricted-syntax */ // oxlint-disable-next-line typescript/no-for-in-array, guard-for-in
  for (const i in arr) {
    globalThis.String(arr[i]);
  }
}
