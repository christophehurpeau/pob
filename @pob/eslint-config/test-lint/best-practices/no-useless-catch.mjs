try {
  // eslint-disable-next-line no-undef
  doSomethingThatMightThrow();
  // oxlint-disable-next-line no-useless-catch
} catch (error) {
  throw error;
}
