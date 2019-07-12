'use strict';

const fs = require('fs');

fs.writeFileSync(
  require.resolve('./lib/index.js'),
  `'use strict';

const pkg = require('../package.json');

module.exports = { version: pkg.version, date: ${Date.now()} };
`
);
