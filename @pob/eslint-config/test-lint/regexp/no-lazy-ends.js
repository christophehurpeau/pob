export function test(s) {
  // oxlint-disable-next-line regexp/no-lazy-ends
  return /\w+?/.test(s);
}
