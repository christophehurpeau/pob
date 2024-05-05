<h3 align="center">
  @pob/rollup-esbuild
</h3>

<p align="center">
  rollup configuration with typescript for pob
</p>

<p align="center">
  <a href="https://npmjs.org/package/@pob/rollup-esbuild"><img src="https://img.shields.io/npm/v/@pob/rollup-esbuild.svg?style=flat-square"></a>
  <a href="https://npmjs.org/package/@pob/rollup-esbuild"><img src="https://img.shields.io/npm/dw/@pob/rollup-esbuild.svg?style=flat-square"></a>
  <a href="https://npmjs.org/package/@pob/rollup-esbuild"><img src="https://img.shields.io/node/v/@pob/rollup-esbuild.svg?style=flat-square"></a>
  <a href="https://npmjs.org/package/@pob/rollup-esbuild"><img src="https://img.shields.io/npm/types/@pob/rollup-esbuild.svg?style=flat-square"></a>
</p>

## Install

```bash
npm install --save rollup-esbuild
```

## Usage

```js
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import createRollupConfig from "@pob/rollup-esbuild/createRollupConfig.js";
import run from "@pob/rollup-esbuild/plugin-run.cjs";

const watch = process.env.ROLLUP_WATCH === "true";

export default createRollupConfig({
  cwd: dirname(fileURLToPath(import.meta.url)),
  outDirectory: "build",
  plugins: [watch && run({ execArgv: ["--enable-source-maps"] })],
});
```
