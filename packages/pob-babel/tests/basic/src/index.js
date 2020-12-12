import Test from './Test';

const answer = 42;
console.log(`the answer is ${answer}`);

class Test2 extends Test {
  constructor(...args) {
    super(...args);
  }
}

export const t = new Test2(1, 2, 3);
