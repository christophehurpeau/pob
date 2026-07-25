// eslint-disable-next-line @typescript-eslint/no-unused-vars -- unused const
const y = 10;

// unused parameter
(function (foo) {
  return 5;
})();

try {
  //...
  // eslint-disable-next-line unicorn/prefer-optional-catch-binding -- unused error
} catch (error) {
  console.error("errors");
}

const [
  a,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- unused error
  _b,
  c,
] = ["a", "b", "c"];
console.log(a + c);

// ignoreRestSiblings
const { foo, ...rest } = { foo: 1, other: 2 };
console.log(rest);
