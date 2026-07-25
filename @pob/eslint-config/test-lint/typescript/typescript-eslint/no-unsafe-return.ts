export function f(): string {
  const a: any = 1;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return a;
}
