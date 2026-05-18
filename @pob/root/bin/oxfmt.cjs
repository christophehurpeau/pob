#!/usr/bin/env node

"use strict";

const path = require("node:path");
const pkg = require("oxfmt/package.json");

const pkgPath = require.resolve("oxfmt/package.json");

// eslint-disable-next-line import-x/no-dynamic-require
require(
  path.join(
    path.dirname(pkgPath),
    typeof pkg.bin === "string" ? pkg.bin : pkg.bin.oxfmt,
  ),
);
