<h1 align="center">
  repository-check-dirty
</h1>

<p align="center">
  check that a git repository is not dirty
</p>

<p align="center">
  <a href="https://npmjs.org/package/repository-check-dirty"><img src="https://img.shields.io/npm/v/repository-check-dirty.svg?style=flat-square" alt="npm version"></a>
  <a href="https://npmjs.org/package/repository-check-dirty"><img src="https://img.shields.io/npm/dw/repository-check-dirty.svg?style=flat-square" alt="npm downloads"></a>
  <a href="https://npmjs.org/package/repository-check-dirty"><img src="https://img.shields.io/node/v/repository-check-dirty.svg?style=flat-square" alt="node version"></a>
  <a href="https://npmjs.org/package/repository-check-dirty"><img src="https://img.shields.io/npm/types/repository-check-dirty.svg?style=flat-square" alt="types"></a>
</p>

### Install

```sh
npm install --save-dev repository-check-dirty
```

### How to use

#### Direct use

```
node_modules/.bin/repository-check-dirty
```

#### With npm scripts `npm run release`

Edit your package.json:

```json
{
  "scripts": {
    "preversion": "repository-check-dirty"
  }
}
```
