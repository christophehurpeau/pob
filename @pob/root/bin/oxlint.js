#!/usr/bin/env node

import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import pkg from "oxlint/package.json" with { type: "json" };

/**
 * tsrs-lint of the project's tsrs (0.21+), the same compiler as its "tsc"
 * script: a Rust port of tsgolint, using less memory. Its bin is a node
 * script, which oxlint cannot spawn on windows.
 */
const resolveTsrsLint = () => {
  if (process.platform === "win32") return undefined;
  try {
    const tsrsPackageJsonPath = createRequire(
      path.resolve("package.json"),
    ).resolve("tsrs/package.json");
    const tsrsLintBin = JSON.parse(fs.readFileSync(tsrsPackageJsonPath, "utf8"))
      .bin?.["tsrs-lint"];
    return tsrsLintBin
      ? path.resolve(path.dirname(tsrsPackageJsonPath), tsrsLintBin)
      : undefined;
  } catch {
    return undefined;
  }
};

// oxlint looks for tsgolint (type-aware rules) in the project's
// node_modules/.bin, which does not contain the bins of @pob/root dependencies
const resolveTsgolint = () => {
  const require = createRequire(
    import.meta.resolve("oxlint-tsgolint/package.json"),
  );
  try {
    return require.resolve(
      `@oxlint-tsgolint/${process.platform}-${process.arch}/tsgolint${process.platform === "win32" ? ".exe" : ""}`,
    );
  } catch {
    // unsupported platform: oxlint reports the missing tsgolint when needed
    return undefined;
  }
};

if (!process.env.OXLINT_TSGOLINT_PATH) {
  const tsgolintPath = resolveTsrsLint() || resolveTsgolint();
  if (tsgolintPath) process.env.OXLINT_TSGOLINT_PATH = tsgolintPath;
}

await import(
  new URL(
    typeof pkg.bin === "string" ? pkg.bin : pkg.bin.oxlint,
    import.meta.resolve("oxlint/package.json"),
  ).href
);
