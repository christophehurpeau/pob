#!/usr/bin/env node

'use strict';

const checkWorkingTree = require("@lerna/check-working-tree");


(async () => {
  try {
    await checkWorkingTree();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
