#!/usr/bin/env node

// eslint-disable-next-line import/no-unresolved
import lintStaged from 'lint-staged';

lintStaged({
  concurrent: true,
  relative: true,
})
  .then((passed) => {
    process.exitCode = passed ? 0 : 1;
  })
  // eslint-disable-next-line unicorn/prefer-top-level-await
  .catch(() => {
    process.exitCode = 1;
  });
