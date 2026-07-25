/* eslint-disable no-unreachable */

export const foo = function () {
  try {
    return 1;
  } catch {
    return 2;
  } finally {
    // eslint-disable-next-line no-unsafe-finally
    return 3;
  }
};
