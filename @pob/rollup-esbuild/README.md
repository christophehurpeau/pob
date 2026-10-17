<h1 align="center">
  @pob/rollup-esbuild
</h1>

<p align="center">
  rollup configuration with typescript for pob
</p>

<p align="center">
  <a href="https://npmjs.org/package/@pob/rollup-esbuild"><img src="https://img.shields.io/npm/v/@pob/rollup-esbuild.svg?style=flat-square" alt="npm version"></a>
  <a href="https://npmjs.org/package/@pob/rollup-esbuild"><img src="https://img.shields.io/npm/dw/@pob/rollup-esbuild.svg?style=flat-square" alt="npm downloads"></a>
  <a href="https://npmjs.org/package/@pob/rollup-esbuild"><img src="https://img.shields.io/node/v/@pob/rollup-esbuild.svg?style=flat-square" alt="node version"></a>
  <a href="https://npmjs.org/package/@pob/rollup-esbuild"><img src="https://img.shields.io/npm/types/@pob/rollup-esbuild.svg?style=flat-square" alt="types"></a>
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

## Target-specific files

Each env of `pob.envs` resolves a file in this order, `.ts` standing for every
source extension:

| target         | resolution order                                                 |
| -------------- | ---------------------------------------------------------------- |
| `browser`      | `.web.target-browser.ts`, `.target-browser.ts`, `.web.ts`, `.ts` |
| `node`         | `.web.target-node.ts`, `.target-node.ts`, `.web.ts`, `.ts`       |
| `react-native` | `.target-react-native.ts`, `.ts`                                 |

- `.target-<target>` selects by runtime: put code needing browser globals
  (`window`, `document`, `localStorage`) in `.target-browser` files, and code
  needing Node APIs in `.target-node` files.
- `.web` selects by platform, as react-native does: the react-native-web
  variant of a component. The `node` build includes it, because its consumer is
  web server rendering (expo-router static output resolves the `node` export on
  the server), which must render the tree the `browser` build hydrates. A `.web`
  file must therefore not touch browser globals outside of effects and event
  handlers.

Pass `getExtensions(extensions, env)` to `createRollupConfig` to resolve
differently.
