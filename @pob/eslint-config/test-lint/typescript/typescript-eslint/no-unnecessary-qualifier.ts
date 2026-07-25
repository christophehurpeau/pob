// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace A {
  export const x = 1;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-qualifier
  export const y = A.x;
}
