const { execSync } = require('child_process');
const glob = require('glob');

module.exports = function clean(envs) {
    console.log('> cleaning');

    if (!envs) {
        execSync('rm -Rf lib-* test/node6');
        console.log('done.');
        return;
    }

    const diff = glob.sync('lib*').filter(path => !envs.includes(path.substr('lib-'.length)));
    if (diff.length) {
        console.log('removing: ' + diff.join(','));
        if (diff.some(diff => diff.startsWith('src'))) {
            throw new Error('Cannot contains src');
        }

        execSync('rm -Rf ' + diff.join(' '));
    }

    console.log('done.');
};
