<h3 align="center">
  @pob/pretty-eslint-config
</h3>

<p align="center">
  prettier and sort eslint config
</p>

<p align="center">
  <a href="https://npmjs.org/package/@pob/pretty-eslint-config"><img src="https://img.shields.io/npm/v/@pob/pretty-eslint-config.svg?style=flat-square"></a>
</p>

## Install

```bash
npm install --save @pob/pretty-eslint-config
```

## Usage

### Bin

#### directly

```bash
yarn pretty-eslint-config .eslintrc.json
```

#### with lint-staged

```json
{
  "lint-staged": {
    ".eslintrc.json": ["pretty-eslint-config"]
  }
}
```

### Lib

#### overrideSync

```js
const { overrideSync } = require('@pob/pretty-eslint-config');

overrideSync('.eslintrc.json');
```

#### writeSync

```js
const fs = require('fs');
const { writeSync } = require('@pob/pretty-eslint-config');

const eslintConfig = JSON.parse(fs.readFileSync('.eslintrc.json', 'utf-8'));
writeSync(eslintConfig, '.eslintrc.json');
```

#### default

```js
const fs = require('fs');
const prettyEslintConfig = require('@pob/pretty-eslint-config');

// parsing yourself
const eslintConfig = JSON.parse(fs.readFileSync('.eslintrc.json', 'utf-8'));
fs.writeFileSync(prettyEslintConfig(eslintConfig), '.eslintrc.json');

// let prettyPkg parse
const eslintConfig = fs.readFileSync('.eslintrc.json', 'utf-8');
fs.writeFileSync(prettyEslintConfig(eslintConfig), '.eslintrc.json');
```
