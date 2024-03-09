<h3 align="center">
  @pob/rollup-swc
</h3>

<p align="center">
  rollup configuration with swc for pob
</p>

<p align="center">
  <a href="https://npmjs.org/package/@pob/rollup-swc"><img src="https://img.shields.io/npm/v/@pob/rollup-swc.svg?style=flat-square"></a>
  <a href="https://npmjs.org/package/@pob/rollup-swc"><img src="https://img.shields.io/npm/dw/@pob/rollup-swc.svg?style=flat-square"></a>
  <a href="https://npmjs.org/package/@pob/rollup-swc"><img src="https://img.shields.io/node/v/@pob/rollup-swc.svg?style=flat-square"></a>
  <a href="https://npmjs.org/package/@pob/rollup-swc"><img src="https://img.shields.io/npm/types/@pob/rollup-swc.svg?style=flat-square"></a>
</p>

## Install

```bash
npm install --save rollup-swc
```

## Usage

```js
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import createRollupConfig from '@pob/rollup-swc/createRollupConfig.js';
import run from '@pob/rollup-swc/plugin-run.cjs';

const watch = process.env.ROLLUP_WATCH === 'true';

export default createRollupConfig({
  cwd: dirname(fileURLToPath(import.meta.url)),
  outDirectory: 'build',
  plugins: [watch && run({ execArgv: ['--enable-source-maps'] })],
});
```
