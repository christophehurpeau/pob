'use strict';

const prettier = require('prettier');

exports.writeAndFormat = function writeAndFormat(fs, destinationPath, content) {
  fs.write(
    destinationPath,
    prettier.format(content, {
      filepath: destinationPath,
      trailingComma: 'all',
      singleQuote: true,
      arrowParens: 'always',
    }),
  );
};

exports.writeAndFormatJson = function writeAndFormatJson(
  fs,
  destinationPath,
  value,
) {
  exports.writeAndFormat(fs, destinationPath, JSON.stringify(value, null, 2));
};
exports.copyAndFormatTpl = function copyAndFormatTpl(
  fs,
  templatePath,
  destinationPath,
  options,
) {
  fs.copyTpl(templatePath, destinationPath, options);
  exports.writeAndFormat(fs, destinationPath, fs.read(destinationPath));
};
