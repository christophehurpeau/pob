export class A {
  m(): unknown {
    // eslint-disable-next-line @typescript-eslint/no-this-alias, unicorn/no-this-assignment
    const self = this;
    return self;
  }
}
