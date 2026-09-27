export function doSomething() {
  // oxlint-disable-next-line no-unused-vars
  let foo;
  const bar = 1;

  // eslint-disable-next-line no-return-assign
  return (foo = bar + 2);
}
