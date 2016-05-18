# pob [![NPM version][npm-image]][npm-url]

Pile of bones, library generator with git/babel/eslint/readme/mocha/jsdoc.
Better than a skeleton !

## How to install

```
npm install -g pob
mkdir some-lib
cd some-lib
pob
```

### Perfect !

You can now use `npm run watch` !

### How this works

#### Babel and es6

Write code in es6 in the `src` directory, it's then transpiled with babel to `dist`.
Use the task `npm run build` or `npm run watch` to transpile the code.

There are several environments: `node5`, `node6`, `modern-browsers` and `es5`.
For each of these environments, there is also a `dev` version that add flow runtime checks.

#### Coding Rules

Eslint is used to ensure a common coding style. I mostly follow the [Airbnb coding style](https://github.com/airbnb/javascript/blob/master/README.md).
You can check the code by running the task `npm run lint`. With an editor, install the plugins to validate the code as you type !

#### Documentation

[jsdoc](http://usejsdoc.org/) allows to document the code and generate the api.
[istanbul](https://www.npmjs.com/package/istanbul) is used to generate the coverage.
You can generate the documentation with `npm run doc`.

#### Tests

Tests are in the directory `test/src`, transpiled with babel to `test/node6`. Use the task `npm test` to run the tests.
Compilation to `test/node6` is done by `npm run build` or `npm run watch`.
Prefer to follow the structure in `test/src` like `src` and tests each file.

### Available tasks with `npm run`

#### Code, Transpile, Lint

- `clean`: remove `dist`, `test/node6` and `docs`/`coverage` directories.
- `build`: `clean` the directory, build `src` to `dist`, `test/src` to `test/node6`
- `watch`: `clean` then build and watch `src` and `test/src` directories
- `lint`: execute `eslint`
- `test`: run tests with mocha (execute build/watch before if needed)

### Generate documentation

- `generate-docs`: run `generate-api` and `generate-test-coverage`
- `generate-api`: generate api with jsdoc
- `generate-test-coverage`: generate coverage documentation

### Publish a new release

- `release`

In the process, this will pre-generate a changelog based on the commits, then open nano so you can adapt it if you want.


[npm-image]: https://img.shields.io/npm/v/pob.svg?style=flat
[npm-url]: https://npmjs.org/package/pob
