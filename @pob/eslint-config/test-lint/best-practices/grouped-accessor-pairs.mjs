export const foo = {
  get a() {
    return this.val;
  },
  b: 1,
  // eslint-disable-next-line grouped-accessor-pairs
  set a(value) {
    this.val = value;
  },
};
