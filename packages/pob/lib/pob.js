#!/usr/bin/env node

'use strict';

const { existsSync, writeFileSync, readFileSync } = require('fs');
const { execSync, spawnSync } = require('child_process');
const updateNotifier = require('update-notifier');
const yeoman = require('yeoman-environment');
const argv = require('minimist-argv');
const mkdirp = require('mkdirp');
const pkg = require('../package.json');

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

const printUsage = () => {
  console.error('Usage: pob [lerna] lib|app');
  console.error('       pob [lerna] update [--force]');
  console.error('       pob lerna convert-npm');
  console.error('       pob add <packageName>');
};

let lerna = argv._[0] === 'lerna';
const action = lerna ? argv._[1] : argv._[0];

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
      'Missing workspaces field in package.json: not a lerna repo'
    );
  }

  const packagesPath = pkg.workspaces[0].replace(/\/\*$/, '');

  mkdirp(`${packagesPath}/${packageName}`);
  writeFileSync(`${packagesPath}/${packageName}/.yo-rc.json`, '{}');
  writeFileSync(
    `${packagesPath}/${packageName}/package.json`,
    JSON.stringify({ name: packageName, version: '1.0.0-pre' })
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
let type = updateOnly ? null : action;
const fromPob = updateOnly && argv._[1] === 'from-pob';

if (updateOnly) {
  if (existsSync('lerna.json')) {
    lerna = true;
    type = 'lib'; // TODO
  } else if (existsSync('.yo-rc.json') || existsSync('.pob.json')) {
    type = 'lib'; // TODO
  } else {
    console.error('Missing first argument: type');
    printUsage();
    process.exit(1);
  }
}

if (!existsSync('.yo-rc.json')) {
  writeFileSync('.yo-rc.json', '{}');
}

const options = {
  type,
  updateOnly,
  lerna,
  fromPob,
  force: argv.force,
};

const generator = env.run('pob:generator', options, (err) => {
  if (err) {
    console.error(err.stack || err.message || err);
    process.exit(1);
  }
});

generator.on('error', (err) => {
  console.error(err.stack || err.message || err);
  process.exit(1);
});
