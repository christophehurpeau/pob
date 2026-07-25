/* global foo */
// eslint-disable-next-line no-useless-catch
try {
  foo();
  // eslint-disable-next-line unicorn/catch-error-name
} catch (e) {
  throw e;
}
