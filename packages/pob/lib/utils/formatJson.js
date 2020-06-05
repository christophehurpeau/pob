'use strict';

const prettier = require('prettier');

module.exports = function formatJson(value, filename) {
  const json = JSON.stringify(value, null, 2);
  return prettier.format(json, { filepath: filename });
};
