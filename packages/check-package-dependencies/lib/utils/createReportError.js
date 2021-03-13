'use strict';

const chalk = require('chalk');

let titleDisplayed = null;
let pkgPathDisplayed = null;
exports.createReportError = (title, pkgPathName) => {
  return function reportError(msgTitle, msgInfo, onlyWarns) {
    if (titleDisplayed !== title || pkgPathName !== pkgPathDisplayed) {
      if (titleDisplayed) console.error();
      console.error(chalk.cyan(`== ${title} in ${pkgPathName} ==`));
      titleDisplayed = title;
      pkgPathDisplayed = pkgPathName;
    }
    console.error(
      `${
        onlyWarns ? chalk.yellow(`⚠ ${msgTitle}`) : chalk.red(`❌ ${msgTitle}`)
      }${msgInfo ? `: ${msgInfo}` : ''}`,
    );
    if (!onlyWarns) {
      // console.trace();
      process.exitCode = 1;
    }
  };
};
