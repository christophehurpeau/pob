#!/usr/bin/env node

import lintStaged from "lint-staged";

// oxlint-disable-next-line unicorn/prefer-top-level-await
lintStaged({
  concurrent: true,
  relative: true,
})
  .then((passed) => {
    process.exitCode = passed ? 0 : 1;
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
