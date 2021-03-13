'use strict';

const chalk = require('chalk');

let titleDisplayed = null;
let pkgPathDisplayed = null;
exports.createReportError = (title, pkgPath) => {
  return function reportError(msgTitle, msgInfo, onlyWarns) {
    if (titleDisplayed !== title || pkgPath !== pkgPathDisplayed) {
      if (titleDisplayed) console.error();
      console.error(chalk.cyan(`== ${title} in ${pkgPath} ==`));
      titleDisplayed = title;
      pkgPathDisplayed = pkgPath;
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
