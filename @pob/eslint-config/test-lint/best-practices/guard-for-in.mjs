const foo = {};

// eslint-disable-next-line no-restricted-syntax, guard-for-in
for (const key in foo) {
  console.log(key, foo[key]);
}
