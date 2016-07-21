const EventEmitter = require('events');
const clean = require('./clean');
const transpile = require('./transpile');

module.exports = function build(pobrc, cwd, envs, watch = false) {
    if (!envs) {
        envs = pobrc.envs;

        if (envs.includes('node5')) {
            console.log('[WARN] node5 is deprecated.');
            envs = envs.filter(env => env === 'node5');
        }

        envs = envs.reduce((res, env) => {
            res.push(env, `${env}-dev`);
            return res;
        }, []);
    }

    clean(envs);
    console.log(`> ${watch ? 'watching' : 'building'}... (${envs.join(',')})`);

    if (watch) {
        watch = new EventEmitter();
    }

    return Promise.all([
        transpile(pobrc, cwd, pobrc.src || 'src', env => `lib-${env}`, envs, watch),
        pobrc.testing && transpile(pobrc, cwd, 'test/src', () => 'test/node6', ['node6'], watch),
    ]).then(() => watch);
};
