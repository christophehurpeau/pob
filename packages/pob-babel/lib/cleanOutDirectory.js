import fs from 'node:fs';
import path from 'node:path';

export function cleanOutDirectory({ outDirectory = 'dist' } = {}) {
  if (fs.rmSync) {
    fs.rmSync(path.resolve(outDirectory), { recursive: true, force: true });
  } else {
    fs.rmdirSync(path.resolve(outDirectory), { recursive: true, force: true });
  }
}
