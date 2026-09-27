function g(): void {
  globalThis.Math.random();
}
// oxlint-disable-next-line typescript/no-meaningless-void-operator, no-void
export const r = void g();
