'use strict';

const fs = require('fs');
const pkg = require('./package.json');

fs.writeFileSync(
  './lib/index.d.ts',
  `
interface Dependencies {
  ${Object.keys(pkg.devDependencies)
    .map((dep) => `'${dep}': '${pkg.devDependencies[dep]}'`)
    .join(';\n  ')};
} 

export = dependencies;
`
);
