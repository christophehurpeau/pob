// oxlint-disable-next-line typescript/use-unknown-in-catch-callback-variable, unicorn/prefer-top-level-await
export const p = Promise.resolve().catch((error: any) => {
  globalThis.String(error);
});
