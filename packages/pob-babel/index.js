const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;
const EventEmitter = require('events');
const babel = require('babel-core');
const chokidar = require('chokidar');
const glob = require('glob');
const readdir = require('fs-readdir-recursive');
const slash = require('slash');
const Lock = require('lock');
const Queue = require('promise-queue');
const promiseCallback = require('promise-callback-factory').default;
const copyChmod = require('./copyChmod');
const copyFile = require('./copyFile');
const writeFile = require('./writeFile');

const cwd = process.cwd();
const pobrc = JSON.parse(fs.readFileSync(`${cwd}/.pobrc.json`));
const options = require(`./options`);
const queue = new Queue(40, Infinity);

function toErrorStack(err) {
    if (err._babel && err instanceof SyntaxError) {
        return `${err.name}: ${err.message}\n${err.codeFrame}`;
    } else {
        return err.stack;
    }
}

const clean = exports.clean = function clean(envs) {
    console.log('> cleaning');

    if (!envs) {
        execSync('rm -Rf lib-*');
        console.log('done.');
        return;
    }

    const diff = glob.sync('lib*').filter(path => !envs.includes(path.substr('lib-'.length)));
    if (diff.length) {
        console.log('removing: ' + diff.join(','));
        if (diff.some(diff => diff.startsWith('src'))) throw new Error('Cannot contains src');
        execSync('rm -Rf ' + diff.join(' '));
    }

    console.log('done.');
};

const transpile = exports.transpile = function transpile(src, outFn, envs, watch) {
    const srcFiles = glob.sync(src, { cwd });
    const _lock = Lock();
    const lock = resource => new Promise(resolve => _lock(resource, release => resolve(() => release()())));

    const optsManagers = {};

    envs.forEach(env => {
        const optsManager = new babel.OptionManager;

        optsManager.mergeOptions({
            options: options(env, pobrc.react),
            alias: 'base',
            loc: cwd,
        });

        optsManagers[env] = optsManager;
    });


    function handle(filename) {
        return promiseCallback(done => fs.stat(filename, done))
            .catch(err => {
                console.log(err);
                process.exit(1);
            })
            .then(stat => {
                if (stat.isDirectory(filename)) {
                    let dirname = filename;

                    const allSrcFiles = readdir(dirname);

                    envs.forEach(env => {
                        const out = outFn(env);
                        const envAllFiles = readdir(out);

                        const diff = envAllFiles.filter(path => !allSrcFiles.includes(path.replace(/.map$/, '')));
                        if (diff.length) {
                            console.log(`${out}: removing: ${diff.join(',')}`);
                            execSync('rm -Rf ' + diff.map(filename => path.join(out, filename)).join(' '));
                        }
                    });

                    return Promise.all(allSrcFiles.map(filename => {
                        let src = path.join(dirname, filename);
                        return handleFile(src, filename);
                    }));
                } else {
                }
            });
    }

    function destFromSrc(relative, out) {
        // remove extension and then append back on .js
        relative = relative.slice(0, -path.extname(relative).length) + '.js';
        return path.join(out, relative);
    }

    function handleFile(src, relative) {
        if (_lock.isLocked(relative)) console.log(relative + ' locked, waiting...');
        return lock(relative).then(release => {
            return queue.add(() => {
                if (babel.util.canCompile(relative)) {
                    console.log('compiling: ' + relative);

                    return Promise.resolve(src)
                        .then(src => promiseCallback(done => fs.readFile(src, done)))
                        .then(content => {
                            return Promise.all(envs.map(env => {
                                const out = outFn(env);
                                const dest = destFromSrc(relative, out);

                                const opts = optsManagers[env].init({ filename: relative });
                                opts.babelrc = false;
                                opts.sourceMap = true;
                                opts.sourceFileName = slash(path.relative(dest + "/..", src));
                                opts.sourceMapTarget = path.basename(relative);

                                return Promise.resolve(content)
                                    .then(content => babel.transform(content, opts))
                                    .catch(watch && (err => {
                                        console.log(toErrorStack(err));

                                        return {
                                            code: 'throw new Error("Syntax Error");',
                                            map: null,
                                        };
                                    }))
                                    .then(data => {
                                        const mapLoc = dest + ".map";
                                        data.code = data.code + "\n//# sourceMappingURL=" + path.basename(mapLoc);
                                        return writeFile(dest, data.code)
                                            .then(() => Promise.all([
                                                copyChmod(src, dest),
                                                promiseCallback(done => fs.writeFile(mapLoc, JSON.stringify(data.map), done)),
                                            ]));
                                    })
                                    .catch(watch && (err => {
                                        console.log(toErrorStack(err));
                                    }));
                            }));
                        })
                        .then(() => {
                            console.log('compiled: ' + relative);
                        })
                        .catch(err => {
                            console.log(toErrorStack(err));
                            process.exit(1);
                        })
                        .then(() => release());
                } else {
                    console.log('copy: ' + relative);
                    return Promise.all(envs.map(env => {
                        const out = outFn(env);
                        const dest = path.join(out, relative);
                        return copyFile(src, dest).then(() => copyChmod(src, dest));
                    }));
                 }
            });
        });
    }

    if (watch) {
        process.nextTick(() => {
            srcFiles.forEach(dirname => {
                const watcher = chokidar.watch(dirname, {
                    persistent: true,
                    ignoreInitial: true
                });

                function handleChange(filename) {
                    let relative = path.relative(dirname, filename) || filename;
                    console.log('changed: ' + relative);
                    handleFile(filename, relative)
                        .catch(err => {
                            console.log(err.stack);
                        })
                        .then(() => watch.emit('changed', filename));
                }

                watcher.on('add', handleChange);
                watcher.on('change', handleChange);
                watcher.on('unlink', filename => {
                    let relative = path.relative(dirname, filename) || filename;
                    console.log('unlink: ' + relative);
                    if (_lock.isLocked(relative)) console.log(relative + ' locked, waiting...');
                    lock(relative).then(release => {
                        return Promise.all(envs.map(env => {
                            const out = outFn(env);
                            const dest = destFromSrc(relative, out);

                            return Promise.all([
                                promiseCallback(done => fs.unlink(dest, done)).catch(() => {}),
                                promiseCallback(done => fs.unlink(`${dest}.map`, done)).catch(() => {}),
                            ]);
                        }))
                        .then(() => release())
                        .then(() => watch.emit('changed', filename));
                    });
                });
            });
        });
    }

    return Promise.all(srcFiles.map(filename => handle(filename)))
        .then(() => console.log('build finished'))
        .catch(err => {
            console.log(err.stack);
            process.exit(1);
        });
};

const build = exports.build = function build(watch = false) {
    console.log(`> ${watch ? 'watching' : 'building'}... (${pobrc.envs.join(',')})`);

    if (pobrc.envs.includes('node5')) {
        console.log('[WARN] node5 is deprecated.');
        pobrc.envs = pobrc.envs.filter(env => env === 'node5');
    }

    const envs = pobrc.envs.reduce((res, env) => {
        res.push(env, `${env}-dev`);
        return res;
    }, []);

    clean(envs);

    if (watch) {
        watch = new EventEmitter();
    }

    return Promise.all([
        transpile(pobrc.src || 'src', env => `lib-${env}`, envs, watch),
        pobrc.testing && transpile('test/src', () => 'test/node6', ['node6'], watch),
    ]).then(() => watch);
};

const watch = exports.watch = function watch(envs) {
    return build(true);
};
