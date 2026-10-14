import { fileURLToPath } from "node:url";
import runJscodeshift from "./runJscodeshift.cjs";

/**
 * Runs a transform of lib/transforms on `paths`, like `pob-migrate`.
 *
 * @param {string} transformName
 * @param {string[]} paths
 * @param {Record<string, unknown>} [options] jscodeshift runner options
 */
export const runTransform = (transformName, paths, options = {}) =>
  runJscodeshift(
    fileURLToPath(
      new URL(`./transforms/${transformName}.cjs`, import.meta.url),
    ),
    paths,
    options,
  );
