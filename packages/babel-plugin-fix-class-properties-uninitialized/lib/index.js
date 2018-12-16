'use strict';

module.exports = function() {
  return {
    name: 'babel-plugin-fix-class-properties-uninitialized',
    visitor: {
      Class(path, state) {
        const body = path.get("body");

        for (const path of body.get("body")) {
          if (
            path.isProperty() &&
            !path.isPrivate() &&
            !path.node.value
          ) {
            path.remove();
          }
        }
      },
    },
  };
};
