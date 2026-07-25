const boundGetName = function getName() {
  return this.name;
}.bind({ name: "ESLint" });

console.log(boundGetName());

// useless bind
const boundGetName2 = function getName() {
  return "ESLint";
  // eslint-disable-next-line no-extra-bind
}.bind({ name: "ESLint" });

console.log(boundGetName2()); // "ESLint"
