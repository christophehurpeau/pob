const foo = {};

/* eslint-disable-next-line no-restricted-syntax */ // oxlint-disable-next-line guard-for-in
for (const key in foo) {
  console.log(key, foo[key]);
}
