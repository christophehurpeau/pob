#!/usr/bin/env node

import { createRequire } from "node:module";
import pkg from "oxlint/package.json" with { type: "json" };

// oxlint looks for tsgolint (type-aware rules) in the project's
// node_modules/.bin, which does not contain the bins of @pob/root dependencies
if (!process.env.OXLINT_TSGOLINT_PATH) {
  const require = createRequire(
    import.meta.resolve("oxlint-tsgolint/package.json"),
  );
  try {
    process.env.OXLINT_TSGOLINT_PATH = require.resolve(
      `@oxlint-tsgolint/${process.platform}-${process.arch}/tsgolint${process.platform === "win32" ? ".exe" : ""}`,
    );
  } catch {
    // unsupported platform: oxlint reports the missing tsgolint when needed
  }
}

await import(
  new URL(
    typeof pkg.bin === "string" ? pkg.bin : pkg.bin.oxlint,
    import.meta.resolve("oxlint/package.json"),
  ).href
);
