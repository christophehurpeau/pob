#!/usr/bin/env node

'use strict';

const { execSync, spawnSync } = require('child_process');
const { existsSync, writeFileSync, readFileSync } = require('fs');
const fs = require('fs');
const path = require('path');
const argv = require('minimist-argv');
const updateNotifier = require('update-notifier');
const yeoman = require('yeoman-environment');
const pkg = require('../package.json');

const printUsage = () => {
  console.error('Usage: pob [lerna] [lib|app]');
  console.error('       pob [lerna] update [--force]');
  console.error('       pob lerna convert-npm');
  console.error('       pob add <packageName>');
};

const readJson = (filepath) => {
  try {
    return JSON.parse(readFileSync(filepath, 'utf-8'));
  } catch {
    return null;
  }
};

const printVersion = () => {
  console.log(pkg.version);
};

if (argv.version) {
  printVersion();
  process.exit(0);
}

updateNotifier({ pkg }).notify();

const env = yeoman.createEnv();

env.on('error', (err) => {
  console.error(err.stack || err.message || err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.log('uncaughtException', err.stack || err.message || err);
});

env.registerStub(require('./generators/pob'), 'pob:generator');

let lerna = argv._[0] === 'lerna';
const action = lerna ? argv._[1] : argv._[0];
const projectPkg = readJson(path.resolve('./package.json'));

if (action === 'add') {
  if (!existsSync('lerna.json')) {
    console.error('Not in lerna package');
    process.exit(1);
  }

  const packageName = argv._[1];

  if (!packageName) {
    console.error('Missing argument: packageName');
    printUsage();
    process.exit(1);
  }

  const pkg = JSON.parse(readFileSync('package.json'));
  if (!pkg.workspaces) {
    throw new Error(
      'Missing workspaces field in package.json: not a lerna repo',
    );
  }

  const packagesPath = pkg.workspaces[0].replace(/\/\*$/, '');

  fs.mkdirSync(`${packagesPath}/${packageName}`, { recursive: true });
  writeFileSync(`${packagesPath}/${packageName}/.yo-rc.json`, '{}');
  writeFileSync(
    `${packagesPath}/${packageName}/package.json`,
    JSON.stringify({ name: packageName, version: '1.0.0-pre' }, null, 2),
  );
  spawnSync(process.argv[0], [process.argv[1], 'lib'], {
    cwd: `${packagesPath}/${packageName}`,
    stdio: 'inherit',
  });
  process.exit(0);
}

if (lerna && action === 'convert-npm') {
  execSync('sed -i \'/"npmClient": "yarn",/d\' ./lerna.json', {
    stdio: 'inherit',
  });
  execSync('npm install packages/*', { stdio: 'inherit' });
  execSync('yarn lerna link convert', { stdio: 'inherit' });
  execSync('rm -Rf yarn.lock packages/*/yarn.lock', { stdio: 'inherit' });
  process.exit(0);
}

const updateOnly = action === 'update';
const type = updateOnly ? null : action;
const fromPob = updateOnly && argv._[1] === 'from-pob';

if (!existsSync('.yo-rc.json')) {
  if (updateOnly) {
    throw new Error('Cannot update.');
  }

  writeFileSync('.yo-rc.json', '{}');
}

if (existsSync('lerna.json') || (projectPkg && projectPkg.lerna)) {
  lerna = true;
}

const options = {
  type,
  updateOnly,
  lerna,
  fromPob,
  force: argv.force,
};

// const generator =
env.run('pob:generator', options, (err) => {
  if (err) {
    console.error(err.stack || err.message || err);
    process.exit(1);
  }
});

// generator.on('error', (err) => {
//   console.error(err.stack || err.message || err);
//   process.exit(1);
// });
