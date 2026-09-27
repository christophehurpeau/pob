/* eslint-disable no-undef */
export class A1 extends B {
  // oxlint-disable-next-line no-this-before-super
  constructor() {
    // eslint-disable-next-line unicorn/prefer-class-fields
    this.a = 0;
    super();
  }
}
