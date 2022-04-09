import fs from 'fs';
import sortPkg from '@pob/sort-pkg';
import prettier from 'prettier';

export default function ensureJsonFileFormatted(path) {
  try {
    let contentJson = fs.readFileSync(path, 'utf8');
    if (path === 'package.json' || path.endsWith('/package.json')) {
      contentJson = JSON.stringify(sortPkg(JSON.parse(contentJson)), null, 2);
    }
    const formattedPkg = prettier.format(contentJson, {
      filepath: path,
    });
    if (contentJson !== formattedPkg) {
      console.warn(`formatted json file ${path}`);
      fs.writeFileSync(path, formattedPkg);
    }
  } catch {}
}
