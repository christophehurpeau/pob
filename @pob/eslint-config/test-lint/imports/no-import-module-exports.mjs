// eslint-disable-next-line import-x/no-import-module-exports
import { foo } from "./foo.mjs";

/* eslint-disable-next-line no-undef */ // oxlint-disable-next-line import/no-commonjs, unicorn/prefer-module
module.exports = { foo };
