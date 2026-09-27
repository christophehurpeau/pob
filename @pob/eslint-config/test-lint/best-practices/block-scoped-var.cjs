/* oxlint-disable no-constant-condition */
/* oxlint-disable no-var */

"use strict";

exports.doIf = function doIf() {
  if (true) {
    var build = true;
  }

  // oxlint-disable-next-line block-scoped-var
  console.log(build);
};

exports.doIfElse = function doIfElse() {
  if (true) {
    // oxlint-disable-next-line no-redeclare, block-scoped-var
    var build = true;
    // oxlint-disable-next-line block-scoped-var
    console.log(build);
  } else {
    // oxlint-disable-next-line block-scoped-var
    var build = false;
    // oxlint-disable-next-line block-scoped-var
    console.log(build);
  }
};

exports.doTryCatch = function doTryCatch() {
  try {
    var build = 1;
  } catch {
    // oxlint-disable-next-line block-scoped-var
    const f = build;
    console.log(f);
  }
};
