#!/usr/bin/env node

'use strict';

const path = require('path');
const pkg = require('@pob/pretty-pkg/package.json');

// eslint-disable-next-line import/no-dynamic-require
require(path.join('@pob/pretty-pkg', pkg.bin['pretty-pkg']));
