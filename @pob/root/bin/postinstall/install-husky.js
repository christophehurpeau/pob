/* eslint-disable complexity */

'use strict';

const fs = require('fs');
const path = require('path');
const husky = require('husky');
const semver = require('semver');

const ensureLegacyHuskyConfigDeleted = () => {
  try {
    fs.unlinkSync(path.resolve('husky.config.js'));
  } catch {}
  try {
    fs.unlinkSync(path.resolve('.huskyrc'));
  } catch {}
};

const ensureHuskyNotInDevDependencies = (pkg) => {
  if (pkg.devDependencies && pkg.devDependencies.husky) {
    throw new Error(
      'Found husky in devDependencies. Husky is provided by @pob/root, please remove',
    );
  }
};

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

const readYarnConfigFile = () => {
  try {
    return fs.readFileSync(path.resolve('.yarnrc.yml'));
  } catch {
    return '';
  }
};

module.exports = function installHusky({ pkg, pm }) {
  const yarnMajorVersion = pm.name === 'yarn' && semver.major(pm.version);
  const isYarnBerry = pm.name === 'yarn' && yarnMajorVersion >= 2;
  const isYarnPnp =
    isYarnBerry && !readYarnConfigFile().includes('nodeLinker: node-modules');

  /* Check legacy */

  ensureLegacyHuskyConfigDeleted();
  ensureHuskyNotInDevDependencies(pkg);

  /* Create Config */

  const shouldRunTest = () => pkg.scripts && pkg.scripts.test;
  const shouldRunChecks = () => pkg.scripts && pkg.scripts.checks;

  try {
    fs.mkdirSync(path.resolve('.husky'));
  } catch {}

  const pmExec = pm.name === 'npm' ? 'npx --no-install' : pm.name;

  writeHook('commit-msg', `${pmExec} commitlint --edit $1`);
  writeHook('pre-commit', `${pmExec} lint-staged`);

  if (isYarnPnp) {
    ensureHookDeleted('post-checkout');
    ensureHookDeleted('post-merge');
    ensureHookDeleted('post-rewrite');
  } else {
    // https://yarnpkg.com/features/zero-installs
    writeHook('post-checkout', `${pmExec} yarnhook`);
    writeHook('post-merge', `${pmExec} yarnhook`);
    writeHook('post-rewrite', `${pmExec} yarnhook`);
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
};
