export class A {
  // oxlint-disable-next-line typescript/prefer-return-this-type
  m(): A {
    return this;
  }
}
