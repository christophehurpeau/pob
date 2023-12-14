export default class Test {
  constructor(...args) {
    this.args = args;
  }
}

export class TestWithPrivate extends Test {
  #args;

  constructor(...args) {
    this.#args = args;
  }
}
