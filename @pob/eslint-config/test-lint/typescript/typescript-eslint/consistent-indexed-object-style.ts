export interface Foo1 {
  // oxlint-disable-next-line typescript/consistent-indexed-object-style
  [key: string]: unknown;
}

// oxlint-disable-next-line typescript/consistent-type-definitions
export type Foo2 = {
  // oxlint-disable-next-line typescript/consistent-indexed-object-style
  [key: string]: unknown;
};

export type Foo3 = Record<string, unknown>;
