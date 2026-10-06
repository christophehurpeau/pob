export function f(arr: number[]): void {
  // oxlint-disable-next-line eslint-js/no-restricted-syntax, typescript/no-for-in-array, guard-for-in
  for (const i in arr) {
    globalThis.String(arr[i]);
  }
}
