<h3 align="center">
  pob-monorepo
</h3>

<p align="center">
  library generator/tools/scripts
</p>

<h1>Packages</h1>

This repository is a monorepo that we manage using [Yarn Workspaces](https://yarnpkg.com/features/workspaces).

| Package                                                                                                     | Version                                                                                                                                                                                                      | Description                                                                                                           |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| [babel-plugin-fix-class-properties-uninitialized](packages/babel-plugin-fix-class-properties-uninitialized) | <a href="https://npmjs.org/package/babel-plugin-fix-class-properties-uninitialized"><img src="https://img.shields.io/npm/v/babel-plugin-fix-class-properties-uninitialized.svg?style=flat-square"></a>       | babel plugin fix class properties uninitialized                                                                       |
| [babel-preset-pob-env](packages/babel-preset-pob-env)                                                       | <a href="https://npmjs.org/package/babel-preset-pob-env"><img src="https://img.shields.io/npm/v/babel-preset-pob-env.svg?style=flat-square"></a>                                                             | pob babel preset env                                                                                                  |
| [pob](packages/pob)                                                                                         | <a href="https://npmjs.org/package/pob"><img src="https://img.shields.io/npm/v/pob.svg?style=flat-square"></a>                                                                                               | Pile of bones, library generator with git/babel/typescript/typedoc/readme/jest                                        |
| [pob-babel](packages/pob-babel)                                                                             | <a href="https://npmjs.org/package/pob-babel"><img src="https://img.shields.io/npm/v/pob-babel.svg?style=flat-square"></a>                                                                                   | Build and watch with babel and typescript                                                                             |
| [pob-dependencies](packages/pob-dependencies)                                                               | <a href="https://npmjs.org/package/pob-dependencies"><img src="https://img.shields.io/npm/v/pob-dependencies.svg?style=flat-square"></a>                                                                     | easier dependencies upgrade with a real package.json                                                                  |
| [repository-check-dirty](packages/repository-check-dirty)                                                   | <a href="https://npmjs.org/package/repository-check-dirty"><img src="https://img.shields.io/npm/v/repository-check-dirty.svg?style=flat-square"></a>                                                         | check that a git repository is not dirty                                                                              |
| [yarn-workspace-utils](packages/yarn-workspace-utils)                                                       | <a href="https://npmjs.org/package/yarn-workspace-utils"><img src="https://img.shields.io/npm/v/yarn-workspace-utils.svg?style=flat-square"></a>                                                             | workspace utils for yarn berry                                                                                        |
| [@pob/check-lib-dependency-in-root-dev-dependencies](@pob/check-lib-dependency-in-root-dev-dependencies)    | <a href="https://npmjs.org/package/@pob/check-lib-dependency-in-root-dev-dependencies"><img src="https://img.shields.io/npm/v/@pob/check-lib-dependency-in-root-dev-dependencies.svg?style=flat-square"></a> | Checks an lib dependency in root dev dependency. Ensures you have the version you want ! Very useful with yarn berry. |
| [@pob/codemods](@pob/codemods)                                                                              | <a href="https://npmjs.org/package/@pob/codemods"><img src="https://img.shields.io/npm/v/@pob/codemods.svg?style=flat-square"></a>                                                                           | codemods for pob                                                                                                      |
| [@pob/commitlint-config](@pob/commitlint-config)                                                            | <a href="https://npmjs.org/package/@pob/commitlint-config"><img src="https://img.shields.io/npm/v/@pob/commitlint-config.svg?style=flat-square"></a>                                                         | pob commitlint config                                                                                                 |
| [@pob/esbuild](@pob/esbuild)                                                                                | <a href="https://npmjs.org/package/@pob/esbuild"><img src="https://img.shields.io/npm/v/@pob/esbuild.svg?style=flat-square"></a>                                                                             | esbuild configuration for pob                                                                                         |
| [@pob/pretty-eslint-config](@pob/pretty-eslint-config)                                                      | <a href="https://npmjs.org/package/@pob/pretty-eslint-config"><img src="https://img.shields.io/npm/v/@pob/pretty-eslint-config.svg?style=flat-square"></a>                                                   | prettier and sort eslint config                                                                                       |
| [@pob/pretty-pkg](@pob/pretty-pkg)                                                                          | <a href="https://npmjs.org/package/@pob/pretty-pkg"><img src="https://img.shields.io/npm/v/@pob/pretty-pkg.svg?style=flat-square"></a>                                                                       | prettier and sort package.json                                                                                        |
| [@pob/rollup](@pob/rollup)                                                                                  | <a href="https://npmjs.org/package/@pob/rollup"><img src="https://img.shields.io/npm/v/@pob/rollup.svg?style=flat-square"></a>                                                                               | rollup configuration for pob                                                                                          |
| [@pob/rollup-typescript](@pob/rollup-typescript)                                                            | <a href="https://npmjs.org/package/@pob/rollup-typescript"><img src="https://img.shields.io/npm/v/@pob/rollup-typescript.svg?style=flat-square"></a>                                                         | rollup configuration with typescript for pob                                                                          |
| [@pob/root](@pob/root)                                                                                      | <a href="https://npmjs.org/package/@pob/root"><img src="https://img.shields.io/npm/v/@pob/root.svg?style=flat-square"></a>                                                                                   | root package                                                                                                          |
| [@pob/sort-eslint-config](@pob/sort-eslint-config)                                                          | <a href="https://npmjs.org/package/@pob/sort-eslint-config"><img src="https://img.shields.io/npm/v/@pob/sort-eslint-config.svg?style=flat-square"></a>                                                       | sort eslint config                                                                                                    |
| [@pob/sort-object](@pob/sort-object)                                                                        | <a href="https://npmjs.org/package/@pob/sort-object"><img src="https://img.shields.io/npm/v/@pob/sort-object.svg?style=flat-square"></a>                                                                     | sort object                                                                                                           |
| [@pob/sort-pkg](@pob/sort-pkg)                                                                              | <a href="https://npmjs.org/package/@pob/sort-pkg"><img src="https://img.shields.io/npm/v/@pob/sort-pkg.svg?style=flat-square"></a>                                                                           | sort package.json                                                                                                     |
| [@pob-example/next-app](pob-examples/next-app)                                                              |                                                                                                                                                                                                              | pob nextjs app example                                                                                                |
| [example-simple-lib](pob-examples/simple-lib)                                                               |                                                                                                                                                                                                              |
| [example-typescript-lib](pob-examples/typescript-lib)                                                       |                                                                                                                                                                                                              |
| [example-typescript-lib-esbuild](pob-examples/typescript-lib-esbuild)                                       |                                                                                                                                                                                                              |
| [example-typescript-lib-with-rollup-typescript](pob-examples/typescript-lib-with-rollup-typescript)         |                                                                                                                                                                                                              |
| [example-typescript-lib-without-rollup](pob-examples/typescript-lib-without-rollup)                         |                                                                                                                                                                                                              |
| [example-webpack-app](pob-examples/webpack-app)                                                             |                                                                                                                                                                                                              |
