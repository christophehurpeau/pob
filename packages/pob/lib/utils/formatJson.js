'use strict';

const prettier = require('prettier');

module.exports = function formatJson(value, filename) {
  const json = JSON.stringify(value, null);
  return prettier.format(json, { filepath: filename });
};
