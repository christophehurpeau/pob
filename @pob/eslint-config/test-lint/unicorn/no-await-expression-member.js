/* global p */
export async function f() {
  // oxlint-disable-next-line unicorn/no-await-expression-member
  return (await p()).x;
}
