export function f(o: Record<string, number>, k: string): void {
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete o[k];
}
