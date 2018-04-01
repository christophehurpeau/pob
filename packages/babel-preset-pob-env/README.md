# babel-preset-pob-env [![NPM version][npm-image]][npm-url]

pob env babel preset

[![Dependency Status][daviddm-image]][daviddm-url]
[![Dependency ci Status][dependencyci-image]][dependencyci-url]

## Options

- `target` - "node", "browser" or `false`
- `version` - target's version
- `production` - `true` | `false` (default: process.env.NODE_ENV === 'production')
- `loose` - Enable “loose” transformations for any plugins in this preset that allow them (Disabled by default).
- `flow` - Use "flow-runtime" plugin when not in production mode (Disabled by default).
- `optimizations` - Use "babel-preset-optimizations" preset (Enabled by default).
- `modules` - Enable transformation of ES6 module syntax to another module type (Enabled by default to "commonjs"). Can be false to not transform modules, or "commonjs"
- `replacements` - { `[key]`: `true` | `false` }. Default: `{ BROWSER, NODEJS }`, according to target. Always add { PRODUCTION: production }. Key should be uppercase.

## Content

- [babel-preset-pob](https://www.npmjs.com/package/babel-preset-pob)
- [babel-preset-pob-stages](https://www.npmjs.com/package/babel-preset-pob-stages)
- [babel-preset-optimizations](https://www.npmjs.com/package/babel-preset-optimizations)
- [babel-plugin-discard-module-references](https://www.npmjs.com/package/babel-plugin-discard-module-references)

## Needed dependencies

[babel-preset-latest-node](https://www.npmjs.com/package/babel-preset-latest-node) 

- `target` === "node" and `version` !== ("4" | "lts")
             
[babel-preset-modern-browsers](https://www.npmjs.com/package/babel-preset-modern-browsers) 

- `target` === "browser" and `version` === "modern"

[babel-preset-env](https://www.npmjs.com/package/babel-preset-latest-node) 

- `target` === "node" and `version` === ("4" | "lts")
- `target` === "node" and `version` === "jest" and you intend to run it with node 4
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
  "presets": [["pob-env", { "production": true, "replacements": { "BROWSER": false } }]]
}
```

### Via CLI

```sh
babel script.js --presets pob
```

### Via Node API

```javascript
require("babel-core").transform("code", {
  presets: [require('babel-preset-pob-env')]
});
```

```javascript
require("babel-core").transform("code", {
  presets: [[require('babel-preset-pob-env'), { production: process.env.NODE_ENV === 'production' }]]
});
```

[npm-image]: https://img.shields.io/npm/v/babel-preset-pob-env.svg?style=flat-square
[npm-url]: https://npmjs.org/package/babel-preset-pob-env
[daviddm-image]: https://david-dm.org/christophehurpeau/babel-preset-pob-env.svg?style=flat-square
[daviddm-url]: https://david-dm.org/christophehurpeau/babel-preset-pob-env
[dependencyci-image]: https://dependencyci.com/github/christophehurpeau/babel-preset-pob-env/badge?style=flat-square
[dependencyci-url]: https://dependencyci.com/github/christophehurpeau/babel-preset-pob-env
