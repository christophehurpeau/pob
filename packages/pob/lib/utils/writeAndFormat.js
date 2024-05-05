import prettier from "@prettier/sync";

export function writeAndFormat(fs, destinationPath, content, { parser } = {}) {
  fs.write(
    destinationPath,
    prettier.format(content, {
      parser,
      filepath: destinationPath,
      trailingComma: "all",
      arrowParens: "always",
      printWidth: destinationPath === ".yarnrc.yml" ? 9999 : undefined,
    }),
  );
}

function getParserFromDestinationPath(destinationPath) {
  if (destinationPath.endsWith("/lerna.json")) {
    return "json-stringify";
  }
  if (destinationPath.endsWith("json")) {
    return undefined;
  }

  return "json";
}

export function writeAndFormatJson(fs, destinationPath, value) {
  writeAndFormat(fs, destinationPath, JSON.stringify(value, null, 2), {
    // project.code-workspace is json
    parser: getParserFromDestinationPath(destinationPath),
  });
}
export function copyAndFormatTpl(fs, templatePath, destinationPath, options) {
  fs.copyTpl(templatePath, destinationPath, options);
  writeAndFormat(fs, destinationPath, fs.read(destinationPath));
}
