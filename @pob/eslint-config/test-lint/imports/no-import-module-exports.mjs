// eslint-disable-next-line import-x/no-import-module-exports
import { foo } from "./foo.mjs";

/* eslint-disable-next-line import-x/no-commonjs, no-undef */ // oxlint-disable-next-line unicorn/prefer-module
module.exports = { foo };
