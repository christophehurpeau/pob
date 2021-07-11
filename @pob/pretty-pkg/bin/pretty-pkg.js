#!/usr/bin/env node

import { overrideSync } from '../lib/index.js';

const paths = process.argv.slice(2);

if (paths.length === 0) {
  paths.push('package.json');
}

paths.forEach((path) => {
  overrideSync(path);
});
