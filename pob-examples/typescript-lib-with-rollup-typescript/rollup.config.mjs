import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import createRollupConfig from "@pob/rollup-typescript/createRollupConfig.js";

export default createRollupConfig({
  cwd: dirname(fileURLToPath(import.meta.url)),
  outDirectory: "dist",
});
