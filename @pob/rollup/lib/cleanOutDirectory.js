import fs from 'node:fs';
import path from 'node:path';

export function cleanOutDirectory({ outDirectory = 'dist' } = {}) {
  if (fs.rmSync) {
    fs.rmSync('node_modules/.cache/tsc', { recursive: true, force: true });
    fs.rmSync(path.resolve(outDirectory), { recursive: true, force: true });
  } else {
    fs.rmdirSync('node_modules/.cache/tsc', { recursive: true, force: true });
    fs.rmdirSync(path.resolve(outDirectory), { recursive: true, force: true });
  }
}
