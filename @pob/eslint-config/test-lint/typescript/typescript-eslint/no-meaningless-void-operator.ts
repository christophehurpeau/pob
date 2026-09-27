function g(): void {
  globalThis.Math.random();
}
/* eslint-disable-next-line no-void */ // oxlint-disable-next-line typescript/no-meaningless-void-operator
export const r = void g();
