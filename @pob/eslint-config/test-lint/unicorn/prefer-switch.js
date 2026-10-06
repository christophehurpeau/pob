export function test(foo) {
  // oxlint-disable-next-line unicorn-js/prefer-switch
  if (foo === 1) {
    return "a";
  } else if (foo === 2) {
    return "b";
  } else if (foo === 3) {
    return "c";
  }
  return "d";
}
