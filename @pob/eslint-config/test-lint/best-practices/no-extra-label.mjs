/* eslint-disable no-unreachable-loop */
/* eslint-disable no-labels */
/* eslint-disable no-restricted-syntax */
const a = 0;

A: while (a) {
  // eslint-disable-next-line no-extra-label
  break A;
}

B: for (let i = 0; i < 10; ++i) {
  // eslint-disable-next-line no-extra-label
  break B;
}

C: switch (a) {
  case 0:
    // eslint-disable-next-line no-extra-label
    break C;
  default:
    break;
}
