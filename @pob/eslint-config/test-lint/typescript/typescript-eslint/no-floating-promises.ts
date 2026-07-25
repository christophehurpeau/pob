async function g(): Promise<void> {
  await Promise.resolve();
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises, unicorn/prefer-top-level-await
g();
