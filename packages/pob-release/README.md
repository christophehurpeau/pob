# pob-release

Release with ease

### How to use

1. `npm install --save-dev pob-release`
2. node_modules/.bin/pob-release

### `npm run release`

Edit your package.json:

```json
{
    "scripts": {
        "release": "pob-release"
    }
}
```

### What it does

1. Call `npm version` ([modify package.json, create a commit, create a tag](https://docs.npmjs.com/cli/version))
2. Call `git push` and `git push [tag]`


### Options

`pob-release [version]`


If you use npm script:

```
npm run release -- [version]
```

