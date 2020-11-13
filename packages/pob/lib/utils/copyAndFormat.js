'use strict';

const prettier = require('prettier');

exports.copyAndFormatTpl = function copyAndFormatTpl(
  fs,
  templatePath,
  destinationPath,
  options,
) {
  fs.copyTpl(templatePath, destinationPath, options);
  fs.write(
    destinationPath,
    prettier.format(fs.read(destinationPath), {
      filepath: destinationPath,
      singleQuote: true,
      arrowParens: 'always',
    }),
  );
};
