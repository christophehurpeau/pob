'use strict';

const prettier = require('prettier');

module.exports = function formatJson(value) {
  const json = JSON.stringify(value, null, 2);
  return prettier.format(json, { filepath: 'package.json', printWidth: 80 });
};
