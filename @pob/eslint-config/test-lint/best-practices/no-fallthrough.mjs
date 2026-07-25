/* eslint-disable no-undef */

switch (foo) {
  case 1:
    doSomething();

  // eslint-disable-next-line no-fallthrough
  case 2:
    doSomethingElse();

  // eslint-disable-next-line no-fallthrough
  default:
    doSomethingElse();
}
