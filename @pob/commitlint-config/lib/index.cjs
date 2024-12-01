"use strict";

module.exports = {
  extends: [require.resolve("@commitlint/config-conventional")],

  rules: {
    // not in the spec, see https://www.conventionalcommits.org/en/v1.0.0/#specification
    "header-max-length": [0],
    "body-max-line-length": [0],
    "footer-max-line-length": [0],
  },
};
