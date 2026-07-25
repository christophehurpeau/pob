/* eslint-disable prefer-const */
/* eslint-disable no-unused-vars */
const foo = 1;

switch (foo) {
  case 1:
    // eslint-disable-next-line no-case-declarations
    let x = 1;
    break;
  case 2:
    // eslint-disable-next-line no-case-declarations
    const y = 2;
    break;
  case 3:
    // eslint-disable-next-line no-case-declarations
    function f() {}
    break;
  default:
    // eslint-disable-next-line no-case-declarations
    class C {}
}
