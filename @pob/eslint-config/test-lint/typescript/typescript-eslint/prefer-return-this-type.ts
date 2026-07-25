export class A {
  // eslint-disable-next-line @typescript-eslint/prefer-return-this-type
  m(): A {
    return this;
  }
}
