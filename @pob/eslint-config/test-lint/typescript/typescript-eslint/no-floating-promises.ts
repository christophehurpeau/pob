async function g(): Promise<void> {
  await Promise.resolve();
}
// oxlint-disable-next-line typescript/no-floating-promises, unicorn/prefer-top-level-await
g();

// ignoreVoid: false
async function h(): Promise<void> {
  await Promise.resolve();
}
// oxlint-disable-next-line typescript/no-floating-promises, no-void, unicorn/prefer-top-level-await
void h();
