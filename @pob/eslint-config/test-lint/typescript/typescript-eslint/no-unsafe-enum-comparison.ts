enum E {
  A = 0,
}
// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
export const r = (E.A as E) === 0;
