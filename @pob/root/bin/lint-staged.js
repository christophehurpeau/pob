#!/usr/bin/env node

'use strict';

const path = require('path');
const pkg = require('lint-staged/package.json');

// eslint-disable-next-line import/no-dynamic-require
require(path.join(
  'lint-staged',
  typeof pkg.bin === 'string' ? pkg.bin : pkg.bin['lint-staged'],
));
