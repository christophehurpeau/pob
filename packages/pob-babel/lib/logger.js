'use strict';

const nightingale = require('nightingale');
const ConsoleHandler = require('nightingale-console').default;
const Logger = nightingale.default;

const config = level => [
  {
    pattern: /^pob-build/,
    handler: new ConsoleHandler(level),
  },
];

module.exports = {
  config,
  levels: nightingale.levels,
  configure: level => nightingale.configure(config(level || nightingale.levels.ERROR)),
  enable: () => nightingale.configure(config(nightingale.levels.INFO)),
  logger: new Logger('pob-build'),
};
