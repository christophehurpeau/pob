import Test from './Test';

const answer = 42;
console.log(`the answer is ${answer}`);

class Test2 extends Test {
  foo?: Foo;

  constructor(...args) {
    super(...args);
  }
}

class Foo {
  prop!: string;
}

const t = new Test2(1, 2, 3);
t.foo = new Foo();

export default t;
