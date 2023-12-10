#!/usr/bin/env node

import { execSync, spawnSync } from 'node:child_process';
import fs, {
  existsSync,
  writeFileSync,
  readFileSync,
  mkdirSync,
  readdirSync,
} from 'node:fs';
import path from 'node:path';
import minimist from 'minimist';
import * as yeoman from 'yeoman-environment';
import PobAppGenerator from './generators/app/PobAppGenerator.js';
import AppE2ETestingGenerator from './generators/app/e2e-testing/AppE2ETestingGenerator.js';
import AppNextjsGenerator from './generators/app/nextjs/AppNextjsGenerator.js';
import AppRemixGenerator from './generators/app/remix/AppRemixGenerator.js';
import CommonBabelGenerator from './generators/common/babel/CommonBabelGenerator.js';
import CommonLintGenerator from './generators/common/format-lint/CommonLintGenerator.js';
import CommonHuskyGenerator from './generators/common/husky/CommonHuskyGenerator.js';
import CommonRemoveOldDependenciesGenerator from './generators/common/old-dependencies/CommonRemoveOldDependenciesGenerator.js';
import CommonReleaseGenerator from './generators/common/release/CommonReleaseGenerator.js';
import CommonTestingGenerator from './generators/common/testing/CommonTestingGenerator.js';
import CommonTranspilerGenerator from './generators/common/transpiler/CommonTranspilerGenerator.js';
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
import MonorepoLernaGenerator from './generators/monorepo/lerna/MonorepoLernaGenerator.js';
import MonorepoTypescriptGenerator from './generators/monorepo/typescript/MonorepoTypescriptGenerator.js';
import MonorepoWorkspacesGenerator from './generators/monorepo/workspaces/MonorepoWorkspacesGenerator.js';
import PobBaseGenerator from './generators/pob/PobBaseGenerator.js';
import { __dirname } from './pob-dirname.cjs';

const printUsage = () => {
  console.error('Usage: pob [monorepo] [lib|app|init]');
  console.error('       pob [monorepo] update [--force]');
  console.error('       pob add <packageName>');
};

const readJson = (filepath) => {
  try {
    return JSON.parse(readFileSync(filepath, 'utf8'));
  } catch {
    return null;
  }
};

// const printVersion = () => {
//   console.log(pkg.version);
// };

const argv = minimist(process.argv.slice(2));

if (argv.version) {
  // printVersion();
  process.exit(0);
}

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
  AppE2ETestingGenerator,
  'pob:app:e2e-testing',
  `${__dirname}/generators/app/e2e-testing/AppE2ETestingGenerator.js`,
);
env.registerStub(
  AppNextjsGenerator,
  'pob:app:nextjs',
  `${__dirname}/generators/app/nextjs/AppNextjsGenerator.js`,
);
env.registerStub(
  AppRemixGenerator,
  'pob:app:remix',
  `${__dirname}/generators/app/nextjs/AppRemixGenerator.js`,
);
env.registerStub(
  CommonBabelGenerator,
  'pob:common:babel',
  `${__dirname}/generators/common/babel/CommonBabelGenerator.js`,
);
env.registerStub(
  CommonTranspilerGenerator,
  'pob:common:transpiler',
  `${__dirname}/generators/common/transpiler/CommonTranspilerGenerator.js`,
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
  CommonReleaseGenerator,
  'pob:common:release',
  `${__dirname}/generators/common/release/CommonReleaseGenerator.js`,
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
  MonorepoWorkspacesGenerator,
  'pob:monorepo:workspaces',
  `${__dirname}/generators/monorepo/workspaces/MonorepoWorkspacesGenerator.js`,
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

const projectPkg = readJson(path.resolve('./package.json'));
const monorepoArg = argv._[0] === 'lerna' || argv._[0] === 'monorepo';
let monorepo = monorepoArg || !!(projectPkg && projectPkg.workspaces);
const action = monorepoArg ? argv._[1] : argv._[0];

if (action === 'add') {
  if (!projectPkg.workspaces) {
    throw new Error(
      'Missing workspaces field in package.json: not a lerna repo',
    );
  }

  const packageName = monorepoArg ? argv._[2] : argv._[1];

  if (!packageName) {
    console.error('Missing argument: packageName');
    printUsage();
    process.exit(1);
  }
  const packagesPath = packageName.startsWith('@')
    ? packageName
    : projectPkg.workspaces[0].replace(/\/\*$/, '');

  fs.mkdirSync(`${packagesPath}/${packageName}`, { recursive: true });
  writeFileSync(`${packagesPath}/${packageName}/.yo-rc.json`, '{}');
  writeFileSync(
    `${packagesPath}/${packageName}/package.json`,
    JSON.stringify({ name: packageName, version: '1.0.0-pre' }, null, 2),
  );
  console.log('> Creating new Package');
  spawnSync(process.argv[0], [process.argv[1]], {
    cwd: `${packagesPath}/${packageName}`,
    stdio: 'inherit',
  });

  console.log('> Updating monorepo');
  spawnSync(process.argv[0], [process.argv[1], 'update'], {
    stdio: 'inherit',
  });
  process.exit(0);
}

if (action === 'migrate-to-monorepo') {
  if (projectPkg.workspaces) {
    throw new Error('workspaces field already exists in package.json');
  }

  mkdirSync('packages');
  mkdirSync(`packages/${projectPkg.name}`);

  readdirSync('.').forEach((filename) => {
    if (
      ![
        '.git',
        '.vscode',
        '.github',
        '.husky',
        '.yarn',
        '.yarnrc.yml',
        'packages',
        'lint-staged.config.js',
        'yarn.lock',
      ].includes(filename)
    ) {
      execSync(`mv "${filename}" "packages/${projectPkg.name}/"`);
    }
  });

  const monorepoName = `${path.basename(process.cwd())}-monorepo`;
  const monorepoPkg = {
    name: monorepoName,
    version: projectPkg.version,
    author: projectPkg.author,
    license: projectPkg.license,
    repository: projectPkg.repository,
    engines: projectPkg.engines,
    packageManager: projectPkg.packageManager,
  };

  writeFileSync('package.json', JSON.stringify(monorepoPkg, null, 2));

  monorepo = true;
}

const updateOnly = action === 'update';
const init = action === 'init';
const type = updateOnly || init ? null : action;
const fromPob = updateOnly && argv._[1] === 'from-pob';

if (!existsSync('.yo-rc.json')) {
  if (updateOnly) {
    throw new Error('Cannot update.');
  }

  writeFileSync('.yo-rc.json', '{}');
}

if (
  existsSync('lerna.json') ||
  (projectPkg && (projectPkg.lerna || projectPkg.workspaces))
) {
  monorepo = true;
}

const options = {
  type,
  init,
  updateOnly,
  monorepo,
  fromPob,
  force: argv.force,
};

try {
  await env.run('pob', options);
} catch (error) {
  if (error) {
    console.error(error.stack || error.message || error);
    process.exit(1);
  }
}

// generator.on('error', (err) => {
//   console.error(err.stack || err.message || err);
//   process.exit(1);
// });
