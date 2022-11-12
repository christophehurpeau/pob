<h3 align="center">
  babel-plugin-fix-class-properties-uninitialized
</h3>

<p align="center">
  babel plugin fix class properties uninitialized
</p>

<p align="center">
  <a href="https://npmjs.org/package/babel-plugin-fix-class-properties-uninitialized"><img src="https://img.shields.io/npm/v/babel-plugin-fix-class-properties-uninitialized.svg?style=flat-square"></a>
  <a href="https://npmjs.org/package/babel-plugin-fix-class-properties-uninitialized"><img src="https://img.shields.io/npm/dw/babel-plugin-fix-class-properties-uninitialized.svg?style=flat-square"></a>
  <a href="https://npmjs.org/package/babel-plugin-fix-class-properties-uninitialized"><img src="https://img.shields.io/node/v/babel-plugin-fix-class-properties-uninitialized.svg?style=flat-square"></a>
  <a href="https://npmjs.org/package/babel-plugin-fix-class-properties-uninitialized"><img src="https://img.shields.io/npm/types/babel-plugin-fix-class-properties-uninitialized.svg?style=flat-square"></a>
</p>

## Install

```bash
npm install --save babel-plugin-fix-class-properties-uninitialiazed
```

## Usage with .babelrc

```json
{
  "presets": ["@babel/preset-env"],
  "plugins": [
    "babel-plugin-fix-class-properties-uninitialized",
    "@babel/plugin-proposal-class-properties"
  ]
}
```

## What does it do ?

Fixes when you have unitialized properties, for example with `@babel/preset-typescript`:

```typescript
class Foo extends Bar {
  prop!: string;
}
```

```js
class Foo extends Bar {
  constructor() {
    super();
    this.prop = void 0;
  }
}
```

Except it causes an issue if prop is setup in the constructor of Bar.
This plugin removes the uninitialized prop so that @babel/plugin-proposal-class-properties does not process it.
