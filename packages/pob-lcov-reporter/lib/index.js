/* https://github.com/istanbuljs/istanbuljs/blob/master/packages/istanbul-reports/lib/lcov/index.js */

'use strict';

const BaseLcovReport = require('istanbul-reports/lib/lcov');

class LcovReport extends BaseLcovReport {
  constructor(opts) {
    super(opts);
    // override date
    this.html.date = new Date(2000, 0, 1);
  }
}

module.exports = LcovReport;
module.exports.default = LcovReport;
