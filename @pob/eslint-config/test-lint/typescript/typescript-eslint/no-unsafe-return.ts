export function f(): string {
  const a: any = 1;
  // oxlint-disable-next-line typescript/no-unsafe-return
  return a;
}
