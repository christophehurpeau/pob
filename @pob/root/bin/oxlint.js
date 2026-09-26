#!/usr/bin/env node

import pkg from "oxlint/package.json" with { type: "json" };

await import(
  new URL(
    typeof pkg.bin === "string" ? pkg.bin : pkg.bin.oxlint,
    import.meta.resolve("oxlint/package.json"),
  ).href
);
