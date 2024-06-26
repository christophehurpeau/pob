#!/usr/bin/env node

"use strict";

const path = require("node:path");
const pkg = require("prettier/package.json");

// eslint-disable-next-line import/no-dynamic-require
require(
  path.join(
    "prettier",
    typeof pkg.bin === "string" ? pkg.bin : pkg.bin.prettier,
  ),
);
