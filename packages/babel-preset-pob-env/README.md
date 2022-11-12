<h3 align="center">
  babel-preset-pob-env
</h3>

<p align="center">
  pob babel preset env
</p>

<p align="center">
  <a href="https://npmjs.org/package/babel-preset-pob-env"><img src="https://img.shields.io/npm/v/babel-preset-pob-env.svg?style=flat-square"></a>
  <a href="https://npmjs.org/package/babel-preset-pob-env"><img src="https://img.shields.io/npm/dw/babel-preset-pob-env.svg?style=flat-square"></a>
  <a href="https://npmjs.org/package/babel-preset-pob-env"><img src="https://img.shields.io/node/v/babel-preset-pob-env.svg?style=flat-square"></a>
  <a href="https://npmjs.org/package/babel-preset-pob-env"><img src="https://img.shields.io/npm/types/babel-preset-pob-env.svg?style=flat-square"></a>
  <a href="https://codecov.io/gh/christophehurpeau/pob"><img src="https://img.shields.io/codecov/c/github/christophehurpeau/pob/master.svg?style=flat-square"></a>
</p>

## Options

- `target` - "node", "browser" or `false`
- `version` - target's version
- `loose` - Enable “loose” transformations for any plugins in this preset that allow them (Disabled by default).
- `typescript` - Enable [@babel/preset-typescript](https://www.npmjs.com/package/@babel/preset-typescript) (Enabled by default).
- `optimizations` - Use "babel-preset-optimizations" preset (Enabled by default).
- `modules` - Enable transformation of ES6 module syntax to another module type (Disabled by default). Can be false to not transform modules, or "commonjs"

## Needed dependencies

[babel-preset-modern-browsers](https://www.npmjs.com/package/babel-preset-modern-browsers)

- `target` === "browser" and `version` === "modern"

[@babel/preset-env](https://www.npmjs.com/package/@babel/preset-env)

- `target` === "browser" and `version` !== "modern"
- `target` === `false`

## Install

```bash
npm install --save-dev babel-preset-pob-env
yarn add --dev babel-preset-pob-env
```

## Usage

### Via `.babelrc`

**.babelrc**

```json
{
  "presets": ["pob-env"]
}
```

```json
{
  "presets": [
    ["pob-env", { "loose": true]
  ]
}
```

### Via CLI

```sh
babel script.js --presets pob
```

### Via Node API

```javascript
require('babel-core').transform('code', {
  presets: [require('babel-preset-pob-env')],
});
```

```javascript
require('babel-core').transform('code', {
  presets: [[require('babel-preset-pob-env'), { loose: true }]],
});
```
