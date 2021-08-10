#!/usr/bin/env node

'use strict';

const path = require('path');
const pkg = require('@pob/pretty-eslint-config/package.json');

// eslint-disable-next-line import/no-dynamic-require
require(path.join(
  '@pob/pretty-eslint-config',
  typeof pkg.bin === 'string' ? pkg.bin : pkg.bin['pretty-eslint-config'],
));
