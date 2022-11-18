import fs from 'fs';
import prettier from 'prettier';
import { pkgPath } from './helper.cjs';

const pkg = JSON.parse(fs.readFileSync(pkgPath));

fs.writeFileSync(
  './lib/index.d.ts',
  prettier.format(
    `
  interface Dependencies {
    ${Object.keys(pkg.devDependencies)
      .map((dep) => `'${dep}': '${pkg.devDependencies[dep]}'`)
      .join(';\n  ')};
  }

  declare const dependencies: Dependencies;
  export = dependencies;
  `,
    {
      filepath: 'index.d.ts',
      trailingComma: 'all',
      singleQuote: true,
      arrowParens: 'always',
    },
  ),
);
