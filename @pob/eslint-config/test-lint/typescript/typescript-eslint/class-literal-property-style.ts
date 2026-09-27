/* oxlint-disable typescript/explicit-function-return-type */

export class Mx {
  // oxlint-disable-next-line typescript/class-literal-property-style
  static get myField1(): number {
    return 1;
  }

  // oxlint-disable-next-line typescript/class-literal-property-style, no-useless-computed-key
  private get ["myField2"]() {
    return "hello world";
  }
}
