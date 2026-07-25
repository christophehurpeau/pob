export function f(arr: number[][]): number[] {
  // eslint-disable-next-line @typescript-eslint/prefer-reduce-type-parameter, unicorn/no-array-reduce, unicorn/prefer-spread
  return arr.reduce((a, b) => a.concat(b), [] as number[]);
}
