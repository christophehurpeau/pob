#!/usr/bin/env node

'use strict';

const readFileSync = require('fs').readFileSync;
const existsSync = require('fs').existsSync;
const execSync = require('child_process').execSync;
const validateSemver = require('semver').valid;

const isSemverValid = (version) => validateSemver(version) !== null;

/* VERSION */
const pkg = JSON.parse(readFileSync('./package.json'));
const version = pkg.version;
if (!isSemverValid(version)) {
  throw new Error(`Unexpected version: ${version}`);
}

/* AUTHORS */
execSync(
  'git --no-pager log --reverse --format="%aN <%aE>" | sort -fub > AUTHORS' +
    ' && git add AUTHORS && git commit -m "chore(authors): update AUTHORS" AUTHORS || true',
  { stdio: 'inherit' }
);

/* CHANGELOG */

/* eslint-disable prettier/prettier */
execSync(
  `node_modules/.bin/standard-changelog${existsSync('CHANGELOG.md') ? ' --first-release' : ''}`,
  { stdio: 'inherit' }
);
/* eslint-enable prettier/prettier */

execSync('git add CHANGELOG.md');
