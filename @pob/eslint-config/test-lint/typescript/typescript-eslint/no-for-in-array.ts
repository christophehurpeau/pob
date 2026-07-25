export function f(arr: number[]): void {
  // eslint-disable-next-line @typescript-eslint/no-for-in-array, guard-for-in, no-restricted-syntax
  for (const i in arr) {
    globalThis.String(arr[i]);
  }
}
