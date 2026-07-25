/* eslint-disable no-undef */

if (a) {
  foo();
} else if (b) {
  bar();
  // eslint-disable-next-line no-dupe-else-if
} else if (b) {
  baz();
}
