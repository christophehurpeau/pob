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
  fs.writeFileSync(
    path.resolve(`.husky/${hookName}`),
    `#!/usr/bin/env sh\n. "$(dirname "$0")/_/husky.sh"\n\n${hookContent.trim()}\n`,
    {
      mode: '755',
    },
  );
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
  writeHook('pre-commit', `${pmExec} pob-root-lint-staged`);

  if (isYarnPnp) {
    ensureHookDeleted('post-checkout');
    ensureHookDeleted('post-merge');
    ensureHookDeleted('post-rewrite');
  } else {
    const runYarnInstallOnDiff = `
if [ -n "$(git diff HEAD@{1}..HEAD@{0} -- yarn.lock)" ]; then
  yarn install ${
    isYarnBerry
      ? '--immutable --immutable-cache'
      : '--prefer-offline --pure-lockfile --ignore-optional'
  } || true
fi`;

    // https://yarnpkg.com/features/zero-installs
    writeHook('post-checkout', runYarnInstallOnDiff);
    writeHook('post-merge', runYarnInstallOnDiff);
    writeHook('post-rewrite', runYarnInstallOnDiff);
  }

  const prePushHook = [];

  if (shouldRunTest()) {
    prePushHook.push(
      `${pm.name} test --watchAll=false --changedSince=origin/main`,
    );
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
