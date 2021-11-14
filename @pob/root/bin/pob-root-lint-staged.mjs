#!/usr/bin/env node

// eslint-disable-next-line import/no-unresolved
import lintStaged from 'lint-staged';

// const path = require('path');
// const pkg = require('lint-staged/package.json');

// // eslint-disable-next-line import/no-dynamic-require
// require(path.join(
//   'lint-staged',
//   typeof pkg.bin === 'string' ? pkg.bin : pkg.bin['lint-staged'],
// ));

lintStaged({
  concurrent: true,
  relative: true,
});
