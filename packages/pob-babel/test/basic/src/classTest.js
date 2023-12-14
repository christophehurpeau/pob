export default class Test {
  constructor(...args) {
    this.args = args;
  }
}

export class TestWithPrivate {
  #args;

  constructor(...args) {
    this.#args = args;
  }
}
