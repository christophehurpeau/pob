export const o = {
  get x() {
    // eslint-disable-next-line unicorn/no-accessor-recursion
    return this.x;
  },
};
