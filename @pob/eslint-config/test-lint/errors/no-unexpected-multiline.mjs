const a = function () {
  return function () {};
};
/* prettier-ignore */
export const b = a()
// oxlint-disable-next-line no-unexpected-multiline
(0);
