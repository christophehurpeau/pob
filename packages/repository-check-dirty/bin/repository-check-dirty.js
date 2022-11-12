#!/usr/bin/env node

import { execSync } from 'child_process';

try {
  const stdout = execSync('git status --porcelain', { encoding: 'utf8' });
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
