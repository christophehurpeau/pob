import prettier from 'prettier';

export function writeAndFormat(fs, destinationPath, content) {
  fs.write(
    destinationPath,
    prettier.format(content, {
      filepath: destinationPath,
      trailingComma: 'all',
      singleQuote: true,
      arrowParens: 'always',
    }),
  );
}

export function writeAndFormatJson(fs, destinationPath, value) {
  writeAndFormat(fs, destinationPath, JSON.stringify(value, null, 2));
}
export function copyAndFormatTpl(fs, templatePath, destinationPath, options) {
  fs.copyTpl(templatePath, destinationPath, options);
  writeAndFormat(fs, destinationPath, fs.read(destinationPath));
}
