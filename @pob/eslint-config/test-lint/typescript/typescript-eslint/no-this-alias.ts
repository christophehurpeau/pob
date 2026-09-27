export class A {
  m(): unknown {
    // oxlint-disable-next-line typescript/no-this-alias, unicorn/no-this-assignment
    const self = this;
    return self;
  }
}
