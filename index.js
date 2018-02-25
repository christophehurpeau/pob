const { existsSync, writeFileSync } = require('fs');
const updateNotifier = require('update-notifier');
const yeoman = require('yeoman-environment');
const argv = require('minimist-argv');
const mkdirp = require('mkdirp');
const pkg = require('./package.json');

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
  console.error('Usage: pob lib');
  console.error('       pob lerna');
  console.error('       pob add <packageName>');
};

let type = argv._[0];
const updateOnly = type === 'update';
if (updateOnly) type = null;

if (type === 'add') {
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

  mkdirp(`packages/${packageName}`);
  writeFileSync(`packages/${packageName}/.yo-rc.json`, '{}');
  process.exit(0);
}

if (type !== 'lib' && type !== 'lerna') {
  if (existsSync('lerna.json')) {
    type = 'lerna';
  } else if (existsSync('.yo-rc.json')) {
    type = 'lib';
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
  lerna: !!argv.lerna,
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
