export class A {
  // oxlint-disable-next-line typescript/related-getter-setter-pairs
  get x(): number {
    return 1;
  }
  set x(v: string) {
    globalThis.String(v);
  }
}
