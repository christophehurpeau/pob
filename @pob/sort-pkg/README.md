<h1 align="center">
  @pob/sort-pkg
</h1>

<p align="center">
  sort package.json
</p>

<p align="center">
  <a href="https://npmjs.org/package/@pob/sort-pkg"><img src="https://img.shields.io/npm/v/@pob/sort-pkg.svg?style=flat-square" alt="npm version"></a>
  <a href="https://npmjs.org/package/@pob/sort-pkg"><img src="https://img.shields.io/npm/dw/@pob/sort-pkg.svg?style=flat-square" alt="npm downloads"></a>
  <a href="https://npmjs.org/package/@pob/sort-pkg"><img src="https://img.shields.io/node/v/@pob/sort-pkg.svg?style=flat-square" alt="node version"></a>
  <a href="https://npmjs.org/package/@pob/sort-pkg"><img src="https://img.shields.io/npm/types/@pob/sort-pkg.svg?style=flat-square" alt="types"></a>
</p>

## Install

```bash
npm install --save @pob/sort-pkg
```

## Usage

```js
const fs = require("fs");
const sortPkg = require("@pob/sort-pkg");

const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));
sortPkg(pkg);
fs.writeFileSync(JSON.stringify(pkg, null, 2), pkg);
```

## Also see

- [@pob/pretty-pkg](https://npmjs.org/package/@pob/pretty-pkg)
