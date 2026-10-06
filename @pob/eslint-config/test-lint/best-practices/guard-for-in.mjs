const foo = {};

// oxlint-disable-next-line eslint-js/no-restricted-syntax, guard-for-in
for (const key in foo) {
  console.log(key, foo[key]);
}
