/* global foo */
try {
  foo();
  // oxlint-disable-next-line no-useless-catch, unicorn/catch-error-name
} catch (e) {
  throw e;
}
