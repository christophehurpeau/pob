<h1 align="center">
  @pob/esbuild
</h1>

<p align="center">
  esbuild configuration for pob
</p>

<p align="center">
  <a href="https://npmjs.org/package/@pob/esbuild"><img src="https://img.shields.io/npm/v/@pob/esbuild.svg?style=flat-square" alt="npm version"></a>
  <a href="https://npmjs.org/package/@pob/esbuild"><img src="https://img.shields.io/npm/dw/@pob/esbuild.svg?style=flat-square" alt="npm downloads"></a>
  <a href="https://npmjs.org/package/@pob/esbuild"><img src="https://img.shields.io/node/v/@pob/esbuild.svg?style=flat-square" alt="node version"></a>
  <a href="https://npmjs.org/package/@pob/esbuild"><img src="https://img.shields.io/npm/types/@pob/esbuild.svg?style=flat-square" alt="types"></a>
</p>

## Install

```bash
npm install --save rollup-typescript
```

## Usage

```js
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import createRollupConfig from "@pob/rollup-typescript/createRollupConfig.js";
import run from "@pob/rollup-typescript/plugin-run.cjs";

const watch = process.env.ROLLUP_WATCH === "true";

export default createRollupConfig({
  cwd: dirname(fileURLToPath(import.meta.url)),
  outDirectory: "build",
  plugins: [watch && run({ execArgv: ["--enable-source-maps"] })],
});
```
