function doStuff() {
  // do stuff
}

export function test(foo) {
  switch (foo) {
    case 1:
      // eslint-disable-next-line no-lone-blocks
      {
        doStuff();
      }
      // eslint-disable-next-line unicorn/switch-case-break-position
      break;
    default:
      throw new Error("Invalid foo");
  }
}
