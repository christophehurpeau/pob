// oxlint-disable-next-line require-await
export async function f() {
  // oxlint-disable-next-line unicorn/no-useless-promise-resolve-reject
  return Promise.resolve(1);
}
