/* eslint-disable import-x/order */
/* eslint-disable import-x/no-unresolved */
/* eslint-disable unicorn/prefer-node-protocol */

// eslint-disable-next-line import-x/no-duplicates
import { merge } from "module";
import something from "another-module";
// eslint-disable-next-line import-x/no-duplicates
import { find } from "module";

export const a = () => {
  merge();
  something();
  find();
};
