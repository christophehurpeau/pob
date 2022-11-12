<h3 align="center">
  pob-babel
</h3>

<p align="center">
  Build and watch with babel and typescript
</p>

<p align="center">
  <a href="https://npmjs.org/package/pob-babel"><img src="https://img.shields.io/npm/v/pob-babel.svg?style=flat-square"></a>
  <a href="https://npmjs.org/package/pob-babel"><img src="https://img.shields.io/npm/dw/pob-babel.svg?style=flat-square"></a>
  <a href="https://npmjs.org/package/pob-babel"><img src="https://img.shields.io/node/v/pob-babel.svg?style=flat-square"></a>
  <a href="https://npmjs.org/package/pob-babel"><img src="https://img.shields.io/npm/types/pob-babel.svg?style=flat-square"></a>
</p>

### What it does

- Transpiles js and jsx files for specific envs (node, webpack, modern browsers webpack 2)
- Transform yml files to json (for faster load)
- Allow you to register plugins to transform more files by extension

### Install

```sh
npm install --save-dev pob-babel
```

Also install babel plugins and presets

In package.json

```json
{
  "pob": {
    "babelEnvs": [
      {
        "target": "node",
        "version": "14",
        "formats": ["es"]
      },
      {
        "target": "browser",
        "version": "modern",
        "formats": ["es"]
      },
      {
        "target": "browser",
        "formats": ["es"]
      }
    ],
    "entries": ["index"]
  }
}
```

Create `rollup.config.mjs`

```js
import createRollupConfig from 'pob-babel/createRollupConfig.js';

export default createRollupConfig({
  cwd: new URL('.', import.meta.url).pathname,
});
```

### How to use

#### Direct use

```
rollup --config rollup.config.mjs
```

#### With npm scripts `npm run build`

Edit your package.json:

```json
{
  "scripts": {
    "build": "rollup --config rollup.config.mjs",
    "watch": "yarn build --watch"
  }
}
```
