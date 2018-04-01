<h3 align="center">
  pob-babel
</h3>

<p align="center">
  Build and watch with babel
</p>

<p align="center">
  <a href="https://npmjs.org/package/pob-babel"><img src="https://img.shields.io/npm/v/pob-babel.svg?style=flat-square"></a>
  <a href="https://david-dm.org/christophehurpeau/pob?path=packages/pob-babel"><img src="https://david-dm.org/christophehurpeau/pob?path=packages/pob-babel.svg?style=flat-square"></a>
</p>

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
