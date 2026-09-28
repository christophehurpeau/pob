// flags of regexp literals are sorted by oxfmt
export const createRegExp = (pattern) =>
  // oxlint-disable-next-line regexp/sort-flags
  new RegExp(pattern, "ig");
