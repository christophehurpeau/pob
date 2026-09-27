const a = 1;

switch (a) {
  // oxlint-disable-next-line no-duplicate-case
  case 1:
    break;
  case 2:
    break;
  case 1: // duplicate test expression
    break;
  default:
    break;
}
