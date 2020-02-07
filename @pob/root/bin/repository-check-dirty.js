#!/usr/bin/env node

'use strict';

const path = require('path');
const pkg = require('repository-check-dirty/package.json');

// eslint-disable-next-line import/no-dynamic-require
require(path.join('repository-check-dirty', pkg.bin['repository-check-dirty']));
