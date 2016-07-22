const { execSync } = require('child_process');
const glob = require('glob');
const destFromSrc = require('./utils/destFromSrc');
const { logger: parentLogger } = require('./logger');

const logger = parentLogger.child('clean', 'clean');

module.exports = function clean(envs) {
    const startTime = logger.infoTime('starting');

    if (!envs) {
        execSync('rm -Rf lib-* test/node6');
        console.log('done.');
        return;
    }

    const diff = glob.sync('lib*').filter(path => !envs.includes(path.substr('lib-'.length)));
    if (diff.length) {
        logger.warn('removing: ' + diff.join(','));
        if (diff.some(diff => diff.startsWith('src'))) {
            throw new Error('Cannot contains src');
        }

        execSync('rm -Rf ' + diff.join(' '));
    }

    logger.infoSuccessTimeEnd(startTime, 'done.');
};
