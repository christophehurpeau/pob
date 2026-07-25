export class A {
  // eslint-disable-next-line @typescript-eslint/related-getter-setter-pairs
  get x(): number {
    return 1;
  }
  set x(v: string) {
    globalThis.String(v);
  }
}
