<h3 align="center">
  @pob/check-lib-dependency-in-root-dev-dependencies
</h3>

<p align="center">
  Checks an lib dependency in root dev dependency. Ensures you have the version you want ! Very useful with yarn berry.
</p>

<p align="center">
  <a href="https://npmjs.org/package/@pob/commitlint-config"><img src="https://img.shields.io/npm/v/@pob/commitlint-config.svg?style=flat-square"></a>
  <a href="https://david-dm.org/christophehurpeau/pob?path=@pob/commitlint-config"><img src="https://david-dm.org/christophehurpeau/pob.svg?path=@pob/commitlint-config?style=flat-square"></a>
</p>

## Install

```bash
npm install --save @pob/check-lib-dependency-in-root-dev-dependencies
```

## Usage

```js
import checkDep from '@pob/check-lib-dependency-in-root-dev-dependencies';

checkDep(require('package-name/package.json'));
```

## Use Cases

### eslint config lib

- Ensures the plugin has the correct version
- Avoids the app to have to install it, has it's optional in peerDependenciesMeta

> package.json

```json
{
  "name": "@pob/eslint-config",
  "peerDependencies": {
    "eslint": "^7.5.0",
    "eslint-plugin-prettier": "^3.1.4"
  },
  "peerDependenciesMeta": {
    "eslint-plugin-prettier": {
      "optional": true
    }
  },
  "dependencies": {
    "@pob/check-lib-dependency-in-root-dev-dependencies": "^1.0.0",
    "eslint-config-prettier": "^6.11.0",
    "eslint-plugin-prettier": "^3.1.4"
  }
}
```

> index.js

```js
'use strict';

const checkDep = require('@pob/check-lib-dependency-in-root-dev-dependencies');

checkDep(require('rollup/package.json'));

module.exports = {
  plugins: ['prettier'],
  extends: ['eslint-config-prettier'].map(require.resolve),

  rules: {
    'prettier/prettier': 'error',
  },
};
```

### Rollup

Use case for a lib wrapping rollup

> package.json

```json
{
  "name": "pob-babel",
  "peerDependencies": {
    "rollup": "^2.27.1"
  },
  "dependencies": {
    "rollup": "^2.27.1"
  }
}
```

```js
'use strict';

const path = require('path');
const { spawnSync } = require('child_process');
const checkDep = require('@pob/check-lib-dependency-in-root-dev-dependencies');

checkDep(require('rollup/package.json'));

const configPath = path.resolve('rollup.config.js');

spawnSync('yarn', ['rollup', '--config', configPath], {
  stdio: 'inherit',
});
```
