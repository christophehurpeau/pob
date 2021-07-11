import fs from 'fs';
import prettier from 'prettier';

export default function ensureJsonFileFormatted(path) {
  try {
    const pkgJson = fs.readFileSync(path, 'utf-8');
    const formattedPkg = prettier.format(pkgJson, {
      filepath: path,
    });
    if (pkgJson !== formattedPkg) {
      console.warn(`formatted json file ${path}`);
      fs.writeFileSync(path, formattedPkg);
    }
  } catch {}
}
