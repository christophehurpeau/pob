<h3 align="center">
  pob-release
</h3>

<p align="center">
  release with ease
</p>

<p align="center">
  <a href="https://npmjs.org/package/pob-release"><img src="https://img.shields.io/npm/v/pob-release.svg?style=flat-square"></a>
  <a href="https://david-dm.org/christophehurpeau/pob?path=packages/pob-release"><img src="https://david-dm.org/christophehurpeau/pob?path=packages/pob-release.svg?style=flat-square"></a>
</p>

### Install

```sh
npm install --save-dev pob-release
```

### How to use

#### Direct use

```
node_modules/.bin/pob-release [version]
```

#### With npm scripts `npm run release`

Edit your package.json:

```json
{
    "scripts": {
        "lint": "eslint ...",
        "preversion": "npm run lint",
        "version": "pob-version",
        "release": "pob-repository-check-clean && pob-release"
    }
}

```

### What it does

1. Call `npm version` ([modify package.json, create a commit, create a tag](https://docs.npmjs.com/cli/version))
1. (Optional with pob-version) Create/Update AUTHORS
1. (Optional with pob-version) Create/Update CHANGELOG.md (and let you edit with your `$EDITOR`)
1. Call `git push` and `git push [tag]`


### Options

`pob-release [version]`

### Cli

If you use npm script:

```
npm run release -- [version]
```
