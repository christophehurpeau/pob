#!/usr/bin/env node

'use strict';

const path = require('path');
const pkg = require('@commitlint/cli/package.json');

// eslint-disable-next-line import/no-dynamic-require
require(path.join('@commitlint/cli', pkg.bin.commitlint));
