'use strict';

const fs = require('fs');
const pobDependencies = require('pob-dependencies/package.json');
const prettier = require('prettier');

const path = './package.json';
const pkg = JSON.parse(fs.readFileSync(path, 'utf-8'));

const excludePkgNames = [
  '@pob/root',
  '@pob/commitlint-config',
  '@pob/pretty-pkg',
  '@pob/lerna-light',
  'husky',
  'prettier',
  'typescript',
  'repository-check-dirty',
];

const isEslintDep = (dep) =>
  dep.startsWith('eslint') ||
  dep.startsWith('@pob/eslint') ||
  dep.startsWith('@typescript-eslint/');

pkg['renovate-config'].default.packageRules[0].packageNames = Object.keys(
  pobDependencies.devDependencies,
).filter(
  (pkgName) => !excludePkgNames.includes(pkgName) && !isEslintDep(pkgName),
);

pkg['renovate-config'].default.packageRules[1].packagePatterns = [
  '^@pob/eslint-config',
  '^@typescript-eslint/',
  '^eslint-',
];
pkg['renovate-config'].default.packageRules[1].packageNames = ['eslint'];

const formattedPkg = prettier.format(JSON.stringify(pkg, null, 2), {
  filepath: 'package.json',
  printWidth: 80,
});

fs.writeFileSync('./package.json', formattedPkg);
