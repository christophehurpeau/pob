interface T {
  foo: number;
}

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-unnecessary-type-assertion
export const x = { foo: 1 } as T;
export const x2: T = { foo: 1 };

export function bar(): T {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-unnecessary-type-assertion
  return { foo: 1 } as T;
}
