import prettier from 'prettier';

export function writeAndFormat(fs, destinationPath, content, { parser } = {}) {
  fs.write(
    destinationPath,
    prettier.format(content, {
      parser,
      filepath: destinationPath,
      trailingComma: 'all',
      singleQuote: !destinationPath.endsWith('.yml'),
      arrowParens: 'always',
    }),
  );
}

export function writeAndFormatJson(fs, destinationPath, value) {
  writeAndFormat(fs, destinationPath, JSON.stringify(value, null, 2), {
    // project.code-workspace is json
    parser: destinationPath.endsWith('json') ? undefined : 'json',
  });
}
export function copyAndFormatTpl(fs, templatePath, destinationPath, options) {
  fs.copyTpl(templatePath, destinationPath, options);
  writeAndFormat(fs, destinationPath, fs.read(destinationPath));
}
