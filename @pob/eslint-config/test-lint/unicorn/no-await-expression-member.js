/* global p */
export async function f() {
  // eslint-disable-next-line unicorn/no-await-expression-member
  return (await p()).x;
}
