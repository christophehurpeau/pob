export const foo = {
  set a(value) {
    this.val = value;
    // eslint-disable-next-line no-setter-return
    return value;
  },
};
