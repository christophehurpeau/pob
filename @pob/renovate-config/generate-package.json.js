'use strict';

const fs = require('fs');
const prettier = require('prettier');
const pobDependencies = require('pob-dependencies/package.json');

const path = './package.json';
const pkg = JSON.parse(fs.readFileSync(path, 'utf-8'));

const excludePkgNames = ['@pob/repo-config', 'husky'];

pkg['renovate-config'].default.packageRules[0].packageNames = Object.keys(
  pobDependencies.devDependencies
).filter((pkgName) => !excludePkgNames.includes(pkgName));

const formattedPkg = prettier.format(JSON.stringify(pkg, null, 2), {
  parser: 'json',
  printWidth: 80,
});

fs.writeFileSync('./package.json', formattedPkg);
