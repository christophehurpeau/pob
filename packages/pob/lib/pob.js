#!/usr/bin/env node

import { execSync, spawnSync } from 'child_process';
import fs, { existsSync, writeFileSync, readFileSync } from 'fs';
import path from 'path';
import argv from 'minimist-argv';
// import updateNotifier from 'update-notifier';
import yeoman from 'yeoman-environment';
// import pkg from '../package.json';
import PobAppGenerator from './generators/app/PobAppGenerator.js';
import CommonBabelGenerator from './generators/common/babel/CommonBabelGenerator.js';
import CommonLintGenerator from './generators/common/format-lint/CommonLintGenerator.js';
import CommonHuskyGenerator from './generators/common/husky/CommonHuskyGenerator.js';
import CommonRemoveOldDependenciesGenerator from './generators/common/old-dependencies/CommonRemoveOldDependenciesGenerator.js';
import CommonTestingGenerator from './generators/common/testing/CommonTestingGenerator.js';
import CommonTypescriptGenerator from './generators/common/typescript/CommonTypescriptGenerator.js';
import CoreCIGenerator from './generators/core/ci/CoreCIGenerator.js';
import CoreCleanGenerator from './generators/core/clean/CoreCleanGenerator.js';
import CoreEditorConfigGenerator from './generators/core/editorconfig/CoreEditorConfigGenerator.js';
import CoreGitGenerator from './generators/core/git/CoreGitGenerator.js';
import CoreGitGithubGenerator from './generators/core/git/generators/github/CoreGitGithubGenerator.js';
import CoreGitignoreGenerator from './generators/core/gitignore/CoreGitignoreGenerator.js';
import CoreNpmGenerator from './generators/core/npm/CoreNpmGenerator.js';
import CorePackageGenerator from './generators/core/package/CorePackageGenerator.js';
import CoreRenovateGenerator from './generators/core/renovate/CoreRenovateGenerator.js';
import CoreSortPackageGenerator from './generators/core/sort-package/CoreSortPackageGenerator.js';
import CoreVSCodeGenerator from './generators/core/vscode/CoreVSCodeGenerator.js';
import CoreYarnGenerator from './generators/core/yarn/CoreYarnGenerator.js';
import PobLibGenerator from './generators/lib/PobLibGenerator.js';
import LibDocGenerator from './generators/lib/doc/LibDocGenerator.js';
import LibReadmeGenerator from './generators/lib/readme/LibReadmeGenerator.js';
import LibReleaseGenerator from './generators/lib/release/LibReleaseGenerator.js';
import PobMonorepoGenerator from './generators/monorepo/PobMonorepoGenerator.js';
import MonorepoLernaGenerator from './generators/monorepo/lerna/MonorepoLernaGenerator.js';
import MonorepoTypescriptGenerator from './generators/monorepo/typescript/MonorepoTypescriptGenerator.js';
import PobBaseGenerator from './generators/pob/PobBaseGenerator.js';
import { __dirname } from './pob-dirname.cjs';

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

// const printVersion = () => {
//   console.log(pkg.version);
// };

if (argv.version) {
  // printVersion();
  process.exit(0);
}

// updateNotifier({ pkg }).notify();

const env = yeoman.createEnv();

env.on('error', (err) => {
  console.error(err.stack || err.message || err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.log('uncaughtException', err.stack || err.message || err);
});

env.registerStub(
  PobBaseGenerator,
  'pob',
  `${__dirname}/generators/app/PobAppGenerator.js`,
);
env.registerStub(
  PobAppGenerator,
  'pob:app',
  `${__dirname}/generators/app/PobAppGenerator.js`,
);
env.registerStub(
  CommonBabelGenerator,
  'pob:common:babel',
  `${__dirname}/generators/common/babel/CommonBabelGenerator.js`,
);
env.registerStub(
  CommonLintGenerator,
  'pob:common:format-lint',
  `${__dirname}/generators/common/format-lint/CommonLintGenerator.js`,
);
env.registerStub(
  CommonHuskyGenerator,
  'pob:common:husky',
  `${__dirname}/generators/common/husky/CommonHuskyGenerator.js`,
);
env.registerStub(
  CommonRemoveOldDependenciesGenerator,
  'pob:common:remove-old-dependencies',
  `${__dirname}/generators/common/old-dependencies/CommonRemoveOldDependenciesGenerator.js`,
);
env.registerStub(
  CommonTestingGenerator,
  'pob:common:testing',
  `${__dirname}/generators/common/testing/CommonTestingGenerator.js`,
);
env.registerStub(
  CommonTypescriptGenerator,
  'pob:common:typescript',
  `${__dirname}/generators/common/typescript/CommonTypescriptGenerator.js`,
);
env.registerStub(
  CoreCIGenerator,
  'pob:core:ci',
  `${__dirname}/generators/core/ci/CoreCIGenerator.js`,
);
env.registerStub(
  CoreCleanGenerator,
  'pob:core:clean',
  `${__dirname}/generators/core/clean/CoreCleanGenerator.js`,
);
env.registerStub(
  CoreEditorConfigGenerator,
  'pob:core:editorconfig',
  `${__dirname}/generators/core/editorconfig/CoreEditorConfigGenerator.js`,
);
env.registerStub(
  CoreGitGenerator,
  'pob:core:git',
  `${__dirname}/generators/core/git/CoreGitGenerator.js`,
);
env.registerStub(
  CoreGitGithubGenerator,
  'pob:core:git:github',
  `${__dirname}/generators/core/git/generators/github/CoreGitGithubGenerator.js`,
);
env.registerStub(
  CoreGitignoreGenerator,
  'pob:core:gitignore',
  `${__dirname}/generators/core/gitignore/CoreGitignoreGenerator.js`,
);
env.registerStub(
  CoreNpmGenerator,
  'pob:core:npm',
  `${__dirname}/generators/core/npm/CoreNpmGenerator.js`,
);
env.registerStub(
  CorePackageGenerator,
  'pob:core:package',
  `${__dirname}/generators/core/package/CorePackageGenerator.js`,
);
env.registerStub(
  CoreRenovateGenerator,
  'pob:core:renovate',
  `${__dirname}/generators/core/renovate/CoreRenovateGenerator.js`,
);
env.registerStub(
  CoreSortPackageGenerator,
  'pob:core:sort-package',
  `${__dirname}/generators/core/sort-package/CoreSortPackageGenerator.js`,
);
env.registerStub(
  CoreVSCodeGenerator,
  'pob:core:vscode',
  `${__dirname}/generators/core/vscode/CoreVSCodeGenerator.js`,
);
env.registerStub(
  CoreYarnGenerator,
  'pob:core:yarn',
  `${__dirname}/generators/core/yarn/CoreYarnGenerator.js`,
);
env.registerStub(
  PobLibGenerator,
  'pob:lib',
  `${__dirname}/generators/lib/PobLibGenerator.js`,
);
env.registerStub(
  LibDocGenerator,
  'pob:lib:doc',
  `${__dirname}/generators/lib/doc/LibDocGenerator.js`,
);
env.registerStub(
  LibReadmeGenerator,
  'pob:lib:readme',
  `${__dirname}/generators/lib/readme/LibReadmeGenerator.js`,
);
env.registerStub(
  LibReleaseGenerator,
  'pob:lib:release',
  `${__dirname}/generators/lib/release/LibReleaseGenerator.js`,
);
env.registerStub(
  PobMonorepoGenerator,
  'pob:monorepo',
  `${__dirname}/generators/monorepo/PobMonorepoGenerator.js`,
);
env.registerStub(
  MonorepoLernaGenerator,
  'pob:monorepo:lerna',
  `${__dirname}/generators/monorepo/lerna/MonorepoLernaGenerator.js`,
);
env.registerStub(
  MonorepoTypescriptGenerator,
  'pob:monorepo:typescript',
  `${__dirname}/generators/monorepo/typescript/MonorepoTypescriptGenerator.js`,
);

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

(async () => {
  try {
    await env.run('pob', options);
  } catch (err) {
    if (err) {
      console.error(err.stack || err.message || err);
      process.exit(1);
    }
  }
})();

// generator.on('error', (err) => {
//   console.error(err.stack || err.message || err);
//   process.exit(1);
// });
