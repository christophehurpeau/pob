# pob-babel [![NPM version][npm-image]][npm-url]

Build and watch with babel

[![Dependency ci Status][dependencyci-image]][dependencyci-url]
[![Dependency Status][daviddm-image]][daviddm-url]

### What it does

- Transpiles js and jsx files for specific envs (pre-node6, node6, webpack 2, modern browsers webpack 2)
- Transform yml files to json (for faster load)
- Allow you to register plugins to transform more files by extension
- `watch` returns an EventEmitter to allow you to restart your server if needed.

### Install

```sh
npm install --save-dev pob-babel
```

Also install babel plugins and presets

Create .pob.json

```json
{
  "react": false,
  "envs": ["node6", "webpack", "webpack-modern-browsers"],
}
```

### How to use

#### Direct use

```
node_modules/.bin/pob-build
node_modules/.bin/pob-watch
```

#### With npm scripts `npm run build`

Edit your package.json:

```json
{
    "scripts": {
        "build": "pob-build",
        "watch": "pob-watch"
    }
}
```

[npm-image]: https://img.shields.io/npm/v/pob-babel.svg?style=flat-square
[npm-url]: https://npmjs.org/package/pob-babel
[daviddm-image]: https://david-dm.org/christophehurpeau/pob-babel.svg?style=flat-square
[daviddm-url]: https://david-dm.org/christophehurpeau/pob-babel
[dependencyci-image]: https://dependencyci.com/github/christophehurpeau/pob-babel/badge?style=flat-square
[dependencyci-url]: https://dependencyci.com/github/christophehurpeau/pob-babel
