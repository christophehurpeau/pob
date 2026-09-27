export function foo() {
  // oxlint-disable-next-line no-caller
  const callee = arguments.callee;
  console.log(callee);
}
