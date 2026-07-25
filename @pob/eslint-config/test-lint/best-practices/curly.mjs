/* eslint-disable no-undef */
let foo = 0;
if (foo) foo++;
if (foo) {
  foo++;
}

if (foo) {
  doSomething();
} else doSomethingElse();

if (foo) foo(bar, baz);
