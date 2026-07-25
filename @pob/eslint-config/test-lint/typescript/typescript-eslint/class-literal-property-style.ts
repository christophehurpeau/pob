/* eslint-disable @typescript-eslint/explicit-function-return-type */

export class Mx {
  // eslint-disable-next-line @typescript-eslint/class-literal-property-style
  static get myField1(): number {
    return 1;
  }

  // eslint-disable-next-line @typescript-eslint/class-literal-property-style, no-useless-computed-key
  private get ["myField2"]() {
    return "hello world";
  }
}
