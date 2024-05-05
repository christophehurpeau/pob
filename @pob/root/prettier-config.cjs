'use strict';

module.exports = {
  overrides: [
    // use json-stringify for lerna.json as lerna will reformat it on new version
    {
      files: ['lerna.json'],
      options: {
        parser: 'json-stringify',
      },
    },
    {
      files: ['.yarnrc.yml'],
      options: {
        printWidth: 9999,
      },
    },
  ],
};
