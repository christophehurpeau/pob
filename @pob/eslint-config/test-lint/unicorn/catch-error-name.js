/* global foo */
try {
  foo();
  /* eslint-disable-next-line unicorn/catch-error-name */ // oxlint-disable-next-line no-useless-catch
} catch (e) {
  throw e;
}
