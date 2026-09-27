// oxlint-disable-next-line typescript/no-namespace
export namespace A {
  export const x = 1;
  // oxlint-disable-next-line typescript/no-unnecessary-qualifier
  export const y = A.x;
}
