import fs from 'fs';
import path from 'path';

export function cleanOutDirectory({ outDirectory = 'dist' } = {}) {
  if (fs.rmSync) {
    fs.rmSync(path.resolve(outDirectory), { recursive: true, force: true });
  } else {
    fs.rmdirSync(path.resolve(outDirectory), { recursive: true, force: true });
  }
}
