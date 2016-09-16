# pob-release

Release with ease

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

