export class FooError extends Error {
  // eslint-disable-next-line unicorn/custom-error-definition
  constructor(m) {
    // eslint-disable-next-line unicorn/custom-error-definition
    super(m);
    this.message = m;
  }
}
