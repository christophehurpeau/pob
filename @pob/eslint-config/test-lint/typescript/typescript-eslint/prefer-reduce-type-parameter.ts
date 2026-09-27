export function f(arr: number[][]): number[] {
  // oxlint-disable-next-line typescript/prefer-reduce-type-parameter, unicorn/no-array-reduce, unicorn/prefer-spread
  return arr.reduce((a, b) => a.concat(b), [] as number[]);
}
