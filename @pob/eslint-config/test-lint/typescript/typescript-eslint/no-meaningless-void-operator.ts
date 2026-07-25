function g(): void {
  globalThis.Math.random();
}
// eslint-disable-next-line @typescript-eslint/no-meaningless-void-operator, no-void
export const r = void g();
