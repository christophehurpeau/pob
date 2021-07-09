#!/usr/bin/env node

'use strict';

const { execSync } = require('child_process');

try {
  const stdout = execSync('git status --porcelain', { encoding: 'utf-8' });
  if (stdout) {
    console.log(
      'Repository has uncommitted changes, please commit or remove these files:\n',
    );
    console.log(stdout);
    process.exit(1);
  }
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
