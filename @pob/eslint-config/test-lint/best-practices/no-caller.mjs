export function foo() {
  // eslint-disable-next-line no-caller
  const callee = arguments.callee;
  console.log(callee);
}
