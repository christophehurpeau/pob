/* eslint-disable no-constant-condition */
/* eslint-disable no-var */

"use strict";

exports.doIf = function doIf() {
  if (true) {
    var build = true;
  }

  // eslint-disable-next-line block-scoped-var
  console.log(build);
};

exports.doIfElse = function doIfElse() {
  if (true) {
    // eslint-disable-next-line block-scoped-var
    var build = true;
    // eslint-disable-next-line block-scoped-var
    console.log(build);
  } else {
    // eslint-disable-next-line no-redeclare, block-scoped-var
    var build = false;
    // eslint-disable-next-line block-scoped-var
    console.log(build);
  }
};

exports.doTryCatch = function doTryCatch() {
  try {
    var build = 1;
  } catch {
    // eslint-disable-next-line block-scoped-var
    const f = build;
    console.log(f);
  }
};
