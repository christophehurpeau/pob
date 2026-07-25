/* eslint-disable no-undef */

"use strict";

// eslint-disable-next-line import-x/no-dynamic-require
exports.getModule = (name) => require(name);

// you may not require() inside of a try/catch block
try {
  // eslint-disable-next-line import-x/no-dynamic-require
  require(unsafeModule);
} catch (error) {
  console.log(error);
}
