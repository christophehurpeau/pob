<h1 align="center">
  pob
</h1>

<p align="center">
  Pile of bones, library generator with git/babel/typescript/typedoc/readme/vitest
</p>

<p align="center">
  <a href="https://npmjs.org/package/pob"><img src="https://img.shields.io/npm/v/pob.svg?style=flat-square" alt="npm version"></a>
  <a href="https://npmjs.org/package/pob"><img src="https://img.shields.io/npm/dw/pob.svg?style=flat-square" alt="npm downloads"></a>
  <a href="https://npmjs.org/package/pob"><img src="https://img.shields.io/node/v/pob.svg?style=flat-square" alt="node version"></a>
  <a href="https://npmjs.org/package/pob"><img src="https://img.shields.io/npm/types/pob.svg?style=flat-square" alt="types"></a>
</p>

## How to install

```
npm install -g pob
mkdir some-lib
cd some-lib
pob
```

### Perfect !

You can now use `yarn run watch` !

### How this works

#### Coding Rules

Eslint is used to ensure a common coding style. I mostly follow the [Airbnb coding style](https://github.com/airbnb/javascript/blob/master/README.md).
You can check the code by running the task `yarn run lint`. With an editor, install the plugins to validate the code as you type !

### Available tasks with `yarn run`

#### Code, Transpile, Lint

- `build`: `clean` the directory, build `src` to `dist` with rollup
- `watch`: `clean` then build and watch with rollup
- `lint`: execute `eslint`
- `test`: run tests

### Generate documentation

Documentation (api + test coverage) is deployed to gh-pages via a github action.

### Publish a new release

- `yarn run release`

In the process, this will pre-generate a changelog based on the commits, then open nano so you can adapt it if you want.
