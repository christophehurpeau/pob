const obj = { x: "foo" };
const key = "x";
// eslint-disable-next-line no-eval
const value = eval(`obj.${key}`);

console.log(obj, value);
