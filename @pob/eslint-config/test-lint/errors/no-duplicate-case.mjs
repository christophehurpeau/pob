const a = 1;

switch (a) {
  case 1:
    break;
  case 2:
    break;
  // eslint-disable-next-line no-duplicate-case
  case 1: // duplicate test expression
    break;
  default:
    break;
}
