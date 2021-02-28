'use strict';

let titleDisplayed = null;
exports.createReportError = (title, pkgPath) => {
  return (msg, onlyWarns) => {
    if (titleDisplayed !== title) {
      if (titleDisplayed) console.error();
      console.error(`== ${title} in ${pkgPath} ==`);
      titleDisplayed = title;
    }
    console.error((onlyWarns ? '⚠ ' : '❌ ') + msg);
    if (!onlyWarns) {
      // console.trace();
      process.exitCode = 1;
    }
  };
};
