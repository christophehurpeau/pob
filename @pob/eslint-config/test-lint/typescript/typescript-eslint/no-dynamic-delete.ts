export function f(o: Record<string, number>, k: string): void {
  // oxlint-disable-next-line typescript/no-dynamic-delete
  delete o[k];
}
