#!/usr/bin/env node

'use strict';

const fs = require('fs');
const { overrideSync } = require('../lib');

const paths = process.argv.slice(2);
const pkg = fs.readFileSync('package.json', 'utf-8');

if (paths.length === 0) {
  paths.push('.eslintrc.json');
}

paths.forEach(path => {
  overrideSync(path, pkg.prettier);
})
