import fs from 'fs';
import prettier from 'prettier';

const pobDependencies = JSON.parse(
  fs.readFileSync('../../packages/pob-dependencies/package.json'),
);

const path = './package.json';
const pkg = JSON.parse(fs.readFileSync(path));

const excludePkgNames = [
  '@pob/root',
  '@pob/commitlint-config',
  '@pob/pretty-pkg',
  '@pob/lerna-light',
  'prettier',
  'typescript',
  'semver',
  'repository-check-dirty',
  'jest',
  'jest-junit-reporter',
  'typedoc',
];

const isEslintDep = (dep) =>
  dep.startsWith('eslint') ||
  dep.startsWith('@pob/eslint') ||
  dep.startsWith('@typescript-eslint/');

pkg['renovate-config'].default.packageRules[1].packageNames = Object.keys(
  pobDependencies.devDependencies,
).filter(
  (pkgName) =>
    !pkgName.startsWith('@babel') &&
    !pkgName.startsWith('babel-') &&
    !pkgName.startsWith('@types') &&
    !excludePkgNames.includes(pkgName) &&
    !isEslintDep(pkgName),
);

const formattedPkg = prettier.format(JSON.stringify(pkg, null, 2), {
  filepath: 'package.json',
  printWidth: 80,
});

fs.writeFileSync('./package.json', formattedPkg);
