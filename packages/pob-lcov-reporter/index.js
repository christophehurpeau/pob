/* https://github.com/istanbuljs/istanbuljs/blob/master/packages/istanbul-reports/lib/lcov/index.js */

'use strict';

var LcovOnlyReport = require('istanbul-reports/lib/lcovonly'),
  HtmlReport = require('istanbul-reports/lib/html');

function LcovReport() {
  this.lcov = new LcovOnlyReport({ file: 'lcov.info' });
  this.html = new HtmlReport({ subdir: 'lcov-report' });
  // override date
  this.html.date = new Date(2000, 0, 1);
}

['Start', 'End', 'Summary', 'SummaryEnd', 'Detail'].forEach(function(what) {
  var meth = 'on' + what;
  LcovReport.prototype[meth] = function() {
    var args = Array.prototype.slice.call(arguments),
      lcov = this.lcov,
      html = this.html;

    if (lcov[meth]) {
      lcov[meth].apply(lcov, args);
    }
    if (html[meth]) {
      html[meth].apply(html, args);
    }
  };
});

module.exports = LcovReport;
