// eslint-disable-next-line require-await
export async function f() {
  // eslint-disable-next-line unicorn/no-useless-promise-resolve-reject
  return Promise.resolve(1);
}
