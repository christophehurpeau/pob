function doStuff() {
  // do stuff
}

export function test(foo) {
  switch (foo) {
    case 1:
      // oxlint-disable-next-line eslint-js/no-lone-blocks
      {
        doStuff();
      }
      // oxlint-disable-next-line unicorn/switch-case-break-position
      break;
    default:
      throw new Error("Invalid foo");
  }
}
