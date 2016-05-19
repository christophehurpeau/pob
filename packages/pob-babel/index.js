const readFileSync = require('fs').readFileSync;
const execSync = require('child_process').execSync;
const spawn = require('child_process').spawn;

const babel = require.resolve('babel-cli/bin/babel');
const pobrc = JSON.parse(readFileSync(`${process.cwd()}/.pobrc.json`));
const babelrc = require(`./babelrc${pobrc.react ? '' : '-no'}-react.json`);

module.exports = {
    clean() {
        console.log('> rm -Rf dist');
        execSync('rm -Rf dist');
        console.log('done.');
    },

    watch() {
        return this.build(true);
    },

    build(watch = false) {
        this.clean();
        console.log(`> ${watch ? 'watching' : 'building'}... (${pobrc.envs.join(',')})`);
        return Promise.all(pobrc.envs.reduce((res, env) => {
            res.push(env, `${env}-dev`);
            return res;
        }, []).concat(pobrc.testing ? ['testing'] : []).map(env => {
            const isTesting = env === 'testing';
            if (isTesting) {
                env = 'node6';
            }
            return new Promise((resolve) => {
                const child = spawn(
                    babel,
                    [
                        '--no-babelrc',
                        '--presets',
                        babelrc.env[env].presets.join(','),
                        babelrc.env[env].plugins && '--plugins',
                        babelrc.env[env].plugins && babelrc.env[env].plugins.join(','),
                        '--source-maps',
                        watch && '--watch',
                        '--out-dir',
                        isTesting ? 'test/node6' : `dist/${env}`,
                        isTesting ? 'test/src' : 'src',
                    ].filter(Boolean),
                    {
                        env: Object.assign(
                            { NODE_ENV: env.endsWith('-dev') ? 'development' : 'production' },
                            process.env
                        ),
                        cwd: process.cwd(),
                        stdio: 'inherit'
                    }
                );
                child.on('exit', () => resolve());
            });
        })).then(() => console.log('done.'));
    },
};


