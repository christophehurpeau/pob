export class FooError extends Error {
  // oxlint-disable-next-line unicorn/custom-error-definition
  constructor(m) {
    // oxlint-disable-next-line unicorn/custom-error-definition
    super(m);
    this.message = m;
  }
}
