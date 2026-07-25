export function doSomething() {
  let foo;
  const bar = 1;

  // eslint-disable-next-line no-return-assign, no-unused-vars
  return (foo = bar + 2);
}
