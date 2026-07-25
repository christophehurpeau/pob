// ❌
export class Foo1 {
  constructor() {
    // eslint-disable-next-line unicorn/prefer-class-fields
    this.foo = "foo";
  }
}

// ✅
export class Foo2 {
  foo = "foo";
}
