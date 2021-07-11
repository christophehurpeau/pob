import fs from 'fs';
import { pkgPath } from './helper.cjs';

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

fs.writeFileSync(
  './lib/index.d.ts',
  `
interface Dependencies {
  ${Object.keys(pkg.devDependencies)
    .map((dep) => `'${dep}': '${pkg.devDependencies[dep]}'`)
    .join(';\n  ')};
}

declare const dependencies: Dependencies;
export = dependencies;
`,
);
