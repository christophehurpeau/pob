<h3 align="center">
  repository-check-dirty
</h3>

<p align="center">
  check that a git repository is not dirty
</p>

<p align="center">
  <a href="https://npmjs.org/package/repository-check-dirty"><img src="https://img.shields.io/npm/v/repository-check-dirty.svg?style=flat-square"></a>
  <a href="https://david-dm.org/christophehurpeau/pob?path=packages/repository-check-dirty"><img src="https://david-dm.org/christophehurpeau/pob?path=packages/repository-check-dirty.svg?style=flat-square"></a>
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
        "preversion": "pob-repository-dirty",
    }
}

```
