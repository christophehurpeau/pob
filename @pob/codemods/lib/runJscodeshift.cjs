'use strict';

const { run: jscodeshift } = require('jscodeshift/src/Runner');

module.exports = (...args) => {
  return jscodeshift(...args);
};
