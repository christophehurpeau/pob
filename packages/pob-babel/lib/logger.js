const { default: Logger, configure: nightingaleConfigure, levels } = require('nightingale');
const ConsoleHandler = require('nightingale-console').default;

const config = level => (
  [
    {
      pattern: /^pob-build/,
      handler: new ConsoleHandler(level),
    },
  ]
);

module.exports = {
  config,
  levels,
  configure: level => nightingaleConfigure(config(level || levels.ERROR)),
  enable: () => nightingaleConfigure(config(levels.INFO)),
  logger: new Logger('pob-build'),
};
