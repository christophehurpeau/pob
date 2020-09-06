const answer = 42;
console.log(`the answer is ${answer}`);


class Test {
  args: number[];

  constructor(...args: number[]) {
    this.args = args;
  }
}

class Test2 extends Test {
  constructor(...args) {
    super(...args)
  }
}

export const t = new Test2(1, 2, 3);
