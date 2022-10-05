'use strict';

module.exports = {
  trailingComma: 'all',
  singleQuote: true,
  // https://github.com/airbnb/javascript/pull/1863
  arrowParens: 'always',

  overrides: [
    {
      files: ['*.yml'],
      options: {
        singleQuote: false,
      },
    },
  ],
};
