// Unintentional assignment
let x;
// oxlint-disable-next-line no-cond-assign, no-constant-condition
if ((x = 0)) {
  const b = 1;
  console.log(x, b);
}
