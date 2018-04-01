<h3 align="center">
  babel-preset-pob-react
</h3>

<p align="center">
  babel preset react and plugins for pob
</p>

<p align="center">
  <a href="https://npmjs.org/package/babel-preset-pob-react"><img src="https://img.shields.io/npm/v/babel-preset-pob-react.svg?style=flat-square"></a>
  <a href="https://david-dm.org/christophehurpeau/pob?path=packages/babel-preset-pob-react"><img src="https://david-dm.org/christophehurpeau/pob?path=packages/babel-preset-pob-react.svg?style=flat-square"></a>
</p>

## Options

- production: true | false (default: process.env.NODE_ENV === 'production')

## Content

This preset includes [babel-preset-react](https://www.npmjs.com/package/babel-preset-react) and the following plugins:

- [babel-plugin-react-require](https://www.npmjs.com/package/babel-plugin-react-require),
- [babel-plugin-transform-react-jsx-self](https://www.npmjs.com/package/babel-plugin-transform-react-jsx-self) (non-production mode only),
- [babel-plugin-transform-react-jsx-source](https://www.npmjs.com/package/babel-plugin-transform-react-jsx-source) (non-production mode only),

## Alternatives

- [babel-preset-react-app](https://www.npmjs.com/package/babel-preset-react-app)

## Install

```bash
npm install --save-dev babel-preset-pob-react
yarn add --dev babel-preset-pob-react
```

## Usage

See [babel-preset-react readme](https://www.npmjs.com/package/babel-preset-react)
