export const foo = {
  // oxlint-disable-next-line grouped-accessor-pairs
  get a() {
    return this.val;
  },
  b: 1,
  set a(value) {
    this.val = value;
  },
};
