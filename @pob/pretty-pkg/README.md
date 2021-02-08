<h3 align="center">
  @pob/pretty-pkg
</h3>

<p align="center">
  prettier and sort package.json
</p>

<p align="center">
  <a href="https://npmjs.org/package/@pob/pretty-pkg"><img src="https://img.shields.io/npm/v/@pob/pretty-pkg.svg?style=flat-square"></a>
</p>

## Install

```bash
npm install --save @pob/pretty-pkg
```

## Usage

### Bin

#### directly

```bash
yarn pretty-pkg package.json
```

#### with lint-staged

```json
{
  "lint-staged": {
    "package.json": ["pretty-pkg"]
  }
}
```

### Lib

#### overrideSync

```js
const { overrideSync } = require('@pob/pretty-pkg');

overrideSync('package.json');
```

#### writeSync

```js
const fs = require('fs');
const { writeSync } = require('@pob/pretty-pkg');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
writeSync(pkg, 'package.json');
```

#### default

```js
const fs = require('fs');
const prettyPkg = require('@pob/pretty-pkg');

// parsing yourself
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
fs.writeFileSync(prettyPkg(pkg), 'package.json');

// let prettyPkg parse
const pkgContent = fs.readFileSync('package.json', 'utf-8');
fs.writeFileSync(prettyPkg(pkgContent), 'package.json');
```
