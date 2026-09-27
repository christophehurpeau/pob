/* eslint-disable no-undef */

if (a) {
  foo();
  // oxlint-disable-next-line no-dupe-else-if
} else if (b) {
  bar();
} else if (b) {
  baz();
}
