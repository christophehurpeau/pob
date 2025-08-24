<h1 align="center">
  yarn-workspace-utils
</h1>

<p align="center">
  workspace utils for yarn berry
</p>

<p align="center">
  <a href="https://npmjs.org/package/yarn-workspace-utils"><img src="https://img.shields.io/npm/v/yarn-workspace-utils.svg?style=flat-square" alt="npm version"></a>
  <a href="https://npmjs.org/package/yarn-workspace-utils"><img src="https://img.shields.io/npm/dw/yarn-workspace-utils.svg?style=flat-square" alt="npm downloads"></a>
  <a href="https://npmjs.org/package/yarn-workspace-utils"><img src="https://img.shields.io/node/v/yarn-workspace-utils.svg?style=flat-square" alt="node version"></a>
  <a href="https://npmjs.org/package/yarn-workspace-utils"><img src="https://img.shields.io/npm/types/yarn-workspace-utils.svg?style=flat-square" alt="types"></a>
</p>

## Install

```bash
npm install --save yarn-workspace-utils
```

## Usage

```js
import {
  getWorkspaceName,
  buildDependentsMaps,
  buildDependenciesMaps,
  buildTopologicalOrderBatches,
} from "yarn-workspace-utils";
```
