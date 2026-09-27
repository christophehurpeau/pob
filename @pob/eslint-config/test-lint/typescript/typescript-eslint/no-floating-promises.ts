async function g(): Promise<void> {
  await Promise.resolve();
}
// oxlint-disable-next-line typescript/no-floating-promises, unicorn/prefer-top-level-await
g();
