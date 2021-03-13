'use strict';

let titleDisplayed = null;
let pkgPathDisplayed = null;
exports.createReportError = (title, pkgPath) => {
  return (msg, onlyWarns) => {
    if (titleDisplayed !== title || pkgPath !== pkgPathDisplayed) {
      if (titleDisplayed) console.error();
      console.error(`== ${title} in ${pkgPath} ==`);
      titleDisplayed = title;
      pkgPathDisplayed = pkgPath;
    }
    console.error((onlyWarns ? '⚠ ' : '❌ ') + msg);
    if (!onlyWarns) {
      // console.trace();
      process.exitCode = 1;
    }
  };
};
