async function g(): Promise<void> {
  await Promise.resolve();
}
/* eslint-disable-next-line unicorn/prefer-top-level-await */ // oxlint-disable-next-line typescript/no-floating-promises
g();
