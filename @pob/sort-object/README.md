<h1 align="center">
  @pob/sort-object
</h1>

<p align="center">
  sort object
</p>

<p align="center">
  <a href="https://npmjs.org/package/@pob/sort-object"><img src="https://img.shields.io/npm/v/@pob/sort-object.svg?style=flat-square" alt="npm version"></a>
  <a href="https://npmjs.org/package/@pob/sort-object"><img src="https://img.shields.io/npm/dw/@pob/sort-object.svg?style=flat-square" alt="npm downloads"></a>
  <a href="https://npmjs.org/package/@pob/sort-object"><img src="https://img.shields.io/node/v/@pob/sort-object.svg?style=flat-square" alt="node version"></a>
  <a href="https://npmjs.org/package/@pob/sort-object"><img src="https://img.shields.io/npm/types/@pob/sort-object.svg?style=flat-square" alt="types"></a>
</p>

## Install

```bash
npm install --save @pob/sort-object
```

## Usage

```js
import sortObject from "@pob/sort-object";

sortObject({ b: 2, a: 1 });

sortObject({ b: 2, a: 1 }, ["b", "a"]);
```
