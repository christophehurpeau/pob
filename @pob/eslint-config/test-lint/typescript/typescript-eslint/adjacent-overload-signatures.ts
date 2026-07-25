export interface Foo {
  // eslint-disable-next-line @typescript-eslint/method-signature-style
  foo(s: string): void;
  // eslint-disable-next-line @typescript-eslint/method-signature-style
  foo(n: number): void;
  // eslint-disable-next-line @typescript-eslint/method-signature-style
  bar(): void;
  // eslint-disable-next-line @typescript-eslint/adjacent-overload-signatures, @typescript-eslint/method-signature-style, @typescript-eslint/unified-signatures, @typescript-eslint/sort-type-constituents
  foo(sn: string | number): void;
}
