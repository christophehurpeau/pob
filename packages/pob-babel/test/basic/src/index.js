import Test from './Test';
import { sayHello as helloNode } from './helloNode';
import { sayHello as helloBrowser } from './helloBrowser';

__POB_TARGET__ === 'node' ? helloNode() : helloBrowser();

const answer = 42;
console.log(`the answer is ${answer}`);

class Test2 extends Test {
  constructor(...args) {
    super(...args);
  }
}

export const t = new Test2(1, 2, 3);

export const spreadTest = { ...{ test: 'spread' } };

export const foo = t.foo ?? 'default';

export const operator = spreadTest?.toString();
