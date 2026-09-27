export const o = {
  get x() {
    // oxlint-disable-next-line unicorn/no-accessor-recursion
    return this.x;
  },
};
