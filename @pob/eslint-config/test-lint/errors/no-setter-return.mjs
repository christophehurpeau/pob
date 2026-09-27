export const foo = {
  set a(value) {
    this.val = value;
    // oxlint-disable-next-line no-setter-return
    return value;
  },
};
