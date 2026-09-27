enum E {
  A = 0,
}
// oxlint-disable-next-line typescript/no-unsafe-enum-comparison
export const r = (E.A as E) === 0;
