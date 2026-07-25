// Unintentional assignment
let x;
// eslint-disable-next-line no-cond-assign, no-constant-condition
if ((x = 0)) {
  const b = 1;
  console.log(x, b);
}
