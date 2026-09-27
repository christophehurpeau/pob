const obj = { x: "foo" };
const key = "x";
// oxlint-disable-next-line no-eval
const value = eval(`obj.${key}`);

console.log(obj, value);
