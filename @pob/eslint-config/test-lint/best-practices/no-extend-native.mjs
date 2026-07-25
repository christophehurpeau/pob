// seems harmless
// eslint-disable-next-line no-extend-native
Object.prototype.extra = 55;

// loop through some userIds
const users = {
  123: "Stan",
  456: "David",
};

// not what you'd expect
// eslint-disable-next-line no-restricted-syntax, guard-for-in
for (const id in users) {
  console.log(id); // "123", "456", "extra"
}
