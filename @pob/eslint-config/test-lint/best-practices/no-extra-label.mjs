/* oxlint-disable no-unreachable-loop */
/* oxlint-disable no-labels */
/* eslint-disable no-restricted-syntax */
const a = 0;

A: while (a) {
  // oxlint-disable-next-line no-extra-label
  break A;
}

B: for (let i = 0; i < 10; ++i) {
  // oxlint-disable-next-line no-extra-label
  break B;
}

C: switch (a) {
  case 0:
    // oxlint-disable-next-line no-extra-label
    break C;
  default:
    break;
}
