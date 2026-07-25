// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
export interface Foo1 {
  [key: string]: unknown;
}

// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style, @typescript-eslint/consistent-type-definitions
export type Foo2 = {
  [key: string]: unknown;
};

export type Foo3 = Record<string, unknown>;
