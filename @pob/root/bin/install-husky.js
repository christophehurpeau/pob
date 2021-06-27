#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const husky = require('husky');
const semver = require('semver');
const whichPmRuns = require('which-pm-runs');

if (!process.env.INIT_CWD) {
  console.error(
    'Missing process.env.INIT_CWD. Did you use postinstall script ?',
  );
  process.exit(1);
}

process.chdir(process.env.INIT_CWD);

// eslint-disable-next-line import/no-dynamic-require
const pkg = require(path.resolve('package.json'));

/* Check Package Manager */

const pm = process.env.POB_ROOT_FAKE_PM
  ? JSON.parse(process.env.POB_ROOT_FAKE_PM)
  : whichPmRuns() ||
    (fs.existsSync('package-lock.json') ? { name: 'npm' } : undefined);

if (!pm) {
  console.error('Invalid pm, please run with postinstall hook!');
  process.exit(1);
}

if (pm.name !== 'yarn' && pm.name !== 'npm') {
  console.error(
    `Package manager not supported: ${pm.name}. Please run with yarn or npm!`,
  );
  process.exit(1);
}

const yarnMajorVersion = pm.name === 'yarn' && semver.major(pm.version);
const isYarnBerry = pm.name === 'yarn' && yarnMajorVersion >= 2;
const isYarnWithOfflineCache = isYarnBerry;

/* Check legacy */

const ensureLegacyHuskyConfigDeleted = (hookName) => {
  try {
    fs.unlinkSync(path.resolve('husky.config.js'));
  } catch {}
  try {
    fs.unlinkSync(path.resolve('.huskyrc'));
  } catch {}
};

const ensureHuskyNotInDevDependencies = () => {
  if (pkg.devDependencies && pkg.devDependencies.husky) {
    console.error(
      'Found husky in devDependencies. Husky is provided by @pob/root, please remove',
    );
    process.exit(1);
  }
};
ensureLegacyHuskyConfigDeleted();
ensureHuskyNotInDevDependencies();

/* Create Config */

const shouldRunTest = () => pkg.scripts && pkg.scripts.test;
const shouldRunChecks = () => pkg.scripts && pkg.scripts.checks;

try {
  fs.mkdirSync(path.resolve('.husky'));
} catch {}

const writeHook = (hookName, hookContent) => {
  fs.writeFileSync(path.resolve(`.husky/${hookName}`), hookContent, {
    mode: '755',
  });
};

const ensureHookDeleted = (hookName) => {
  try {
    fs.unlinkSync(path.resolve(`.husky/${hookName}`));
  } catch {}
};

const pmExec = pm.name === 'npm' ? 'npx --no-install' : pm.name;

writeHook('commit-msg', `${pmExec} commitlint --edit $1`);
writeHook('pre-commit', `${pmExec} lint-staged`);

if (!isYarnWithOfflineCache) {
  writeHook('post-checkout', `${pmExec} yarnhook`);
  writeHook('post-merge', `${pmExec} yarnhook`);
  writeHook('post-rewrite', `${pmExec} yarnhook`);
} else {
  ensureHookDeleted('post-checkout');
  ensureHookDeleted('post-merge');
  ensureHookDeleted('post-rewrite');
}

const prePushHook = [];

if (shouldRunTest()) {
  prePushHook.push(`CI=true ${pm.name} test`);
}

if (shouldRunChecks()) {
  prePushHook.push(`${pm.name} run checks`);
}

if (prePushHook.length > 0) {
  writeHook('pre-push', prePushHook.join(' && '));
} else {
  ensureHookDeleted('pre-push');
}

husky.install('.husky');
