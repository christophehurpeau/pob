export interface Foo {
  // oxlint-disable-next-line typescript/method-signature-style
  foo(s: string): void;
  // oxlint-disable-next-line typescript/adjacent-overload-signatures, typescript/method-signature-style, typescript/unified-signatures
  foo(n: number): void;
  // oxlint-disable-next-line typescript/method-signature-style
  bar(): void;
  /* eslint-disable-next-line @typescript-eslint/sort-type-constituents */ // oxlint-disable-next-line typescript/method-signature-style
  foo(sn: string | number): void;
}
