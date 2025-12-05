export const quoteArg = (s) => {
  return `'${s.replace(/'/g, "'\"'")}'`;
};
