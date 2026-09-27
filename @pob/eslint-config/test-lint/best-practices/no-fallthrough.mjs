/* eslint-disable no-undef */

switch (foo) {
  case 1:
    doSomething();

  // oxlint-disable-next-line no-fallthrough
  case 2:
    doSomethingElse();

  // oxlint-disable-next-line no-fallthrough
  default:
    doSomethingElse();
}
