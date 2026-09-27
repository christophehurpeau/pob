interface T {
  foo: number;
}

// oxlint-disable-next-line typescript/consistent-type-assertions, typescript/no-unnecessary-type-assertion
export const x = { foo: 1 } as T;
export const x2: T = { foo: 1 };

export function bar(): T {
  // oxlint-disable-next-line typescript/consistent-type-assertions, typescript/no-unnecessary-type-assertion
  return { foo: 1 } as T;
}
