#!/usr/bin/env node

'use strict';

const path = require('path');
const pkg = require('yarnhook/package.json');

// eslint-disable-next-line import/no-dynamic-require
require(path.join('yarnhook', pkg.bin));
