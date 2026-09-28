/* eslint-disable import-x/order */
/* eslint-disable import-x/no-unresolved */
/* oxlint-disable unicorn/prefer-node-protocol */

// oxlint-disable-next-line import/no-duplicates
import { merge } from "module";
import something from "another-module";
import { find } from "module";

export const a = () => {
  merge();
  something();
  find();
};
