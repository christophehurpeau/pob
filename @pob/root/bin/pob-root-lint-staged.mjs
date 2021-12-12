#!/usr/bin/env node

// eslint-disable-next-line import/no-unresolved
import lintStaged from 'lint-staged';

lintStaged({
  concurrent: true,
  relative: true,
});
