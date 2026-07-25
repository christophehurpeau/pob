// Bad
export const o1 = {
  set a(value) {
    this.val = value;
  },
};

// Good
export const o2 = {
  set a(value) {
    this.val = value;
  },
  get a() {
    return this.val;
  },
};
