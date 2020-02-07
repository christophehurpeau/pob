<h3 align="center">
  pob-lcov-reporter
</h3>

<p align="center">
  custom lcov reporter for pob
</p>

<p align="center">
  <a href="https://npmjs.org/package/pob-lcov-reporter"><img src="https://img.shields.io/npm/v/pob-lcov-reporter.svg?style=flat-square"></a>
  <a href="https://david-dm.org/christophehurpeau/pob?path=packages/pob-lcov-reporter"><img src="https://david-dm.org/christophehurpeau/pob.svg?path=packages/pob-lcov-reporter?style=flat-square"></a>
</p>

### Install

```sh
npm install --save-dev pob-repository-dirty
```

### How to use

#### Direct use

```
node_modules/.bin/pob-repository-dirty
```

#### With npm scripts `npm run release`

Edit your package.json:

```json
{
  "scripts": {
    "preversion": "pob-repository-dirty"
  }
}
```
