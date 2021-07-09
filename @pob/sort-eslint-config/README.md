<h3 align="center">
  @pob/sort-eslint-config
</h3>

<p align="center">
  sort eslint config
</p>

<p align="center">
  <a href="https://npmjs.org/package/@pob/sort-eslint-config"><img src="https://img.shields.io/npm/v/@pob/sort-eslint-config.svg?style=flat-square"></a>
</p>

## Install

```bash
npm install --save @pob/sort-eslint-config
```

## Usage

```js
const fs = require('fs');
const sortPkg = require('@pob/sort-eslint-config');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
sortPkg(pkg);
fs.writeFileSync(JSON.stringify(pkg, null, 2), pkg);
```

## Also see

- [@pob/sort-pkg](https://npmjs.org/package/@pob/sort-pkg)
- [@pob/pretty-pkg](https://npmjs.org/package/@pob/pretty-pkg)
- [@pob/pretty-eslint-config](https://npmjs.org/package/@pob/pretty-eslint-config)
