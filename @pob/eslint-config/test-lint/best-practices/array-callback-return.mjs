// eslint-disable-next-line unicorn/no-array-reduce
export const indexMap = [].reduce((memo, item, index) => {
  memo[item] = index;
}, {});

const nodes = {};

// oxlint-disable-next-line array-callback-return
export const foo = Array.from(nodes, (node) => {
  if (node.tagName === "DIV") {
    return true;
  }
});

// oxlint-disable-next-line array-callback-return
export const bar = foo.filter((x) => {
  if (x) {
    return true;
  } else {
  }
});
