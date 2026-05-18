import { format } from "oxfmt";

export async function writeAndFormat(fs, destinationPath, content) {
  const { code: formatted } = await format(destinationPath, content, {
    printWidth: 80,
  });
  return fs.write(destinationPath, formatted);
}

export async function writeAndFormatJson(fs, destinationPath, value) {
  await writeAndFormat(fs, destinationPath, JSON.stringify(value, null, 2));
}
export async function copyAndFormatTpl(
  fs,
  templatePath,
  destinationPath,
  options,
) {
  await fs.copyTpl(templatePath, destinationPath, options);
  await writeAndFormat(fs, destinationPath, fs.read(destinationPath));
}
