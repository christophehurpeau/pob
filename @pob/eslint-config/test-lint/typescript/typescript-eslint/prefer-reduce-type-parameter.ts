export function f(arr: number[][]): number[] {
  /* eslint-disable-next-line unicorn/no-array-reduce, unicorn/prefer-spread */ // oxlint-disable-next-line typescript/prefer-reduce-type-parameter
  return arr.reduce((a, b) => a.concat(b), [] as number[]);
}
