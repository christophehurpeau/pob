/* oxlint-disable prefer-const */
/* oxlint-disable no-unused-vars */
const foo = 1;

switch (foo) {
  case 1:
    // oxlint-disable-next-line no-case-declarations
    let x = 1;
    break;
  case 2:
    // oxlint-disable-next-line no-case-declarations
    const y = 2;
    break;
  case 3:
    // oxlint-disable-next-line no-case-declarations
    function f() {}
    break;
  default:
    // oxlint-disable-next-line no-case-declarations
    class C {}
}
