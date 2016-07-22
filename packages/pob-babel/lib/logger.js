const { 'default': Logger, configure: nightingaleConfigure, levels } = require('nightingale');
const ConsoleHandler = require('nightingale-console').default;

const config = [
    {
        patterns: ['pob-build', 'pob-build.*'],
        handler: new ConsoleHandler(levels.ERROR),
    },
];

module.exports = {
    config,
    configure: () => nightingaleConfigure(config),
    logger: new Logger('pob-build'),
};
