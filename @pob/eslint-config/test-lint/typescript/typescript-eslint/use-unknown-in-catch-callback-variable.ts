/* eslint-disable-next-line unicorn/prefer-top-level-await */ // oxlint-disable-next-line typescript/use-unknown-in-catch-callback-variable
export const p = Promise.resolve().catch((error: any) => {
  globalThis.String(error);
});
