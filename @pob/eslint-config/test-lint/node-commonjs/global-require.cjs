/* eslint-disable no-undef */

"use strict";

// oxlint-disable-next-line import/no-dynamic-require
exports.getModule = (name) => require(name);

// you may not require() inside of a try/catch block
try {
  // oxlint-disable-next-line import/no-dynamic-require
  require(unsafeModule);
} catch (error) {
  console.log(error);
}
