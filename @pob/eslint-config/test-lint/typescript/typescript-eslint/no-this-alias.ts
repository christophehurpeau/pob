export class A {
  m(): unknown {
    /* eslint-disable-next-line unicorn/no-this-assignment */ // oxlint-disable-next-line typescript/no-this-alias
    const self = this;
    return self;
  }
}
