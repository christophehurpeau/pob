import JSON5 from 'json5';

export function readJSON5(fs, destinationPath, defaults) {
  const content = fs.read(destinationPath, null);
  if (content === null) return defaults;
  return JSON5.parse(content);
}
