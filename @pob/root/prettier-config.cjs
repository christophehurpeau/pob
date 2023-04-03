'use strict';

module.exports = {
  trailingComma: 'all',
  singleQuote: true,
  // https://github.com/airbnb/javascript/pull/1863
  arrowParens: 'always',

  overrides: [
    // use json-stringify for lerna.json as lerna will reformat it on new version
    {
      files: ['lerna.json'],
      options: {
        parser: 'json-stringify',
      },
    },
    {
      files: ['*.yml'],
      options: {
        singleQuote: false,
      },
    },
  ],
};
