<h3 align="center">
  @pob/rollup-typescript
</h3>

<p align="center">
  rollup configuration with typescript for pob
</p>

<p align="center">
  <a href="https://npmjs.org/package/@pob/rollup-typescript"><img src="https://img.shields.io/npm/v/@pob/rollup-typescript.svg?style=flat-square"></a>
  <a href="https://npmjs.org/package/@pob/rollup-typescript"><img src="https://img.shields.io/npm/dw/@pob/rollup-typescript.svg?style=flat-square"></a>
  <a href="https://npmjs.org/package/@pob/rollup-typescript"><img src="https://img.shields.io/node/v/@pob/rollup-typescript.svg?style=flat-square"></a>
  <a href="https://npmjs.org/package/@pob/rollup-typescript"><img src="https://img.shields.io/npm/types/@pob/rollup-typescript.svg?style=flat-square"></a>
</p>

## Install

```bash
npm install --save rollup-typescript
```

## Usage

```js
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import createRollupConfig from '@pob/rollup-typescript/createRollupConfig.js';
import run from '@pob/rollup-typescript/plugin-run.cjs';

const watch = process.env.ROLLUP_WATCH === 'true';

export default createRollupConfig({
  cwd: dirname(fileURLToPath(import.meta.url)),
  outDirectory: 'build',
  plugins: [watch && run({ execArgv: ['--enable-source-maps'] })],
});
```
