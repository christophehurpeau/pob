#!/usr/bin/env node

import { cleanOutDirectory } from '../lib/cleanOutDirectory.js';

cleanOutDirectory({
  outDirectory: process.argv.slice(2)[0],
});
