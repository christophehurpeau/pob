#!/usr/bin/env node

'use strict';

const { overrideSync } = require('../lib');

const paths = process.argv.slice(2);


if (paths.length === 0) {
  paths.push('package.json');
}

paths.forEach(path => {
  overrideSync(path);
})
