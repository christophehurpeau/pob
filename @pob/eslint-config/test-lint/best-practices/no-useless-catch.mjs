// eslint-disable-next-line no-useless-catch
try {
  // eslint-disable-next-line no-undef
  doSomethingThatMightThrow();
} catch (error) {
  throw error;
}
