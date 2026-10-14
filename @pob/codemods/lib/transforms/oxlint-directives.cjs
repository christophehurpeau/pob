"use strict";

const { parse } = require("@babel/parser");
const { rewriteDirectiveComments } = require("../utils/oxlintDirectives.cjs");

/**
 * Rewrites the eslint directive comments of rules moved to oxlint, for the
 * major of @pob/eslint-config that no longer runs them in eslint.
 *
 * @type {import("jscodeshift").Transform}
 */
module.exports = (file) => {
  const isTypescript = /\.[cm]?ts$/.test(file.path);
  const { comments = [] } = parse(file.source, {
    // .cjs files may use sloppy mode syntax
    sourceType: /\.c[jt]s$/.test(file.path) ? "script" : "unambiguous",
    allowReturnOutsideFunction: true,
    // only comments are needed: syntax errors do not matter
    errorRecovery: true,
    plugins: isTypescript
      ? ["typescript", "decorators-legacy"]
      : ["typescript", "jsx", "decorators-legacy"],
  });
  const result = rewriteDirectiveComments(
    file.source,
    /** @type {{ type: string; value: string; start: number; end: number }[]} */ (
      comments
    ),
  );
  return result === file.source ? undefined : result;
};
