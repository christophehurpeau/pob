export function doSomething() {
  // oxlint-disable-next-line no-unused-vars, prefer-const
  let foo;
  const bar = 1;

  // oxlint-disable-next-line no-return-assign
  return (foo = bar + 2);
}
