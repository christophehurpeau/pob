#!/usr/bin/env node

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const whichPmRuns = require('which-pm-runs');

if (!process.env.INIT_CWD) {
  console.error(
    'Missing process.env.INIT_CWD. Did you use postinstall script ?',
  );
  process.exit(1);
}

process.chdir(process.env.PROJECT_CWD || process.env.INIT_CWD);

const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json')));

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

require('./postinstall/update-yarn.cjs')({ pkg, pm });
require('./postinstall/install-husky.cjs')({ pkg, pm });
require('./postinstall/install-github-workflows.cjs')({ pkg, pm });
require('./postinstall/install-scripts.cjs')({ pkg, pm });

if (process.env.POB_EXPERIMENTAL_VSCODE_TASKS) {
  require('./postinstall/install-vscode-tasks.cjs')({ pkg, pm });
}
