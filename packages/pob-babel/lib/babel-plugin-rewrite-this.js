'use strict';

/**
 * A visitor to walk the tree, rewriting all `this` references in the top-level scope to be
 * `undefined`.
 */
const rewriteThisVisitor = {
  ThisExpression(path) {
    path.replaceWith(path.scope.buildUndefinedNode());
  },
  Function(path) {
    if (!path.isArrowFunctionExpression()) path.skip();
  },
  ClassProperty(path) {
    path.skip();
  },
};

module.exports = function () {
  return {
    name: 'babel-plugin-rewrite-this',
    visitor: {
      Program: {
        exit(path, state) {
          path.traverse(rewriteThisVisitor);
        },
      },
    },
  };
};
