const a = function () {
  return function () {};
};
/* prettier-ignore */
export const b = a()
// eslint-disable-next-line no-unexpected-multiline
(0);
