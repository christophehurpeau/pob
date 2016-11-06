const { execSync } = require('child_process');
const path = require('path');
const { stat, readFile: readFileCallback, unlink } = require('fs');
const babel = require('babel-core');
const chokidar = require('chokidar');
const glob = require('glob');
const readdir = require('fs-readdir-recursive');
const slash = require('slash');
const Lock = require('lock');
const Queue = require('promise-queue');
const promiseCallback = require('promise-callback-factory').default;
const Logger = require('nightingale').default;
const copyChmod = require('./utils/copyChmod');
const copyFile = require('./utils/copyFile');
const writeFile = require('./utils/writeFile');
const destFromSrc = require('./utils/destFromSrc');
const plugins = require('./plugins');
const createBabelOptions = require(`./babel-options`);
const { logger: parentLogger } = require('./logger');
const Task = require('./cli-spinner');

const readFile = filepath => promiseCallback(done => readFileCallback(filepath, done));


const queue = new Queue(40, Infinity);

function toErrorStack(err) {
    if (err._babel && err instanceof SyntaxError) {
        return `${err.name}: ${err.message}\n${err.codeFrame}`;
    } else {
        return err.stack;
    }
}

module.exports = function transpile(pobrc, cwd, src, outFn, envs, watch, options) {
    const srcFiles = glob.sync(src, { cwd });
    const _lock = Lock();
    const lock = resource => new Promise(resolve => _lock(resource, release => resolve(() => release()())));
    let task = new Task(`build ${src}`);

    let logger = parentLogger.child('build', 'build');
    const watchLogger = parentLogger.child('watch', 'watch');
    let watching = false;

    const timeBuildStarted = Date.now();// logger.infoTime('building ' + src);
    logger.debug('envs', { envs });

    const optsManagers = {};

    envs.forEach(env => {
        const optsManager = new babel.OptionManager;

        optsManager.mergeOptions({
            options: createBabelOptions(env, pobrc.react, options),
            alias: 'base',
            loc: cwd,
        });

        optsManagers[env] = optsManager;
    });


    function handle(filename) {
        return promiseCallback(done => stat(filename, done))
            .catch(err => {
                console.log(err);
                process.exit(1);
            })
            .then(stat => {
                if (stat.isDirectory(filename)) {
                    let dirname = filename;

                    const allSrcFiles = readdir(dirname);
                    const allAllowedDestFiles = allSrcFiles.map(relative => destFromSrc(relative));

                    envs.forEach(env => {
                        const out = outFn(env);
                        const envAllFiles = readdir(out);

                        const diff = envAllFiles.filter(path => !allAllowedDestFiles.includes(path.replace(/.map$/, '')));
                        if (diff.length) {
                            logger.debug(`${out}: removing: ${diff.join(',')}`);
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

    function handleFile(src, relative) {
        if (_lock.isLocked(relative)) logger.debug(relative + ' locked, waiting...');
        return lock(relative).then(release => {
            return queue.add(() => {
                if (babel.util.canCompile(relative, options && options.babelExtensions)) {
                    const subtask = task.subtask('compiling: ' + relative);
                    logger.debug('compiling: ' + relative);

                    return Promise.resolve(src)
                        .then(src => readFile(src))
                        .then(content => {
                            return Promise.all(envs.map(env => {
                                const dest = path.join(outFn(env), destFromSrc(relative));

                                const opts = optsManagers[env].init({ filename: relative });
                                opts.babelrc = false;
                                opts.sourceMap = true;
                                opts.sourceFileName = slash(path.relative(dest + "/..", src));
                                opts.sourceMapTarget = path.basename(relative);

                                return Promise.resolve(content)
                                    .then(content => babel.transform(content, opts))
                                    .catch(watch && (err => {
                                        console.log(toErrorStack(err));

                                        return { map: null, code: 'throw new Error("Syntax Error");' };
                                    }))
                                    .then(data => {
                                        const mapLoc = dest + ".map";
                                        data.code = data.code + "\n//# sourceMappingURL=" + path.basename(mapLoc);
                                        return writeFile(dest, data.code)
                                            .then(() => Promise.all([
                                                copyChmod(src, dest),
                                                writeFile(mapLoc, JSON.stringify(data.map)),
                                            ]));
                                    });
                            }));
                        })
                        .then(() => {
                            logger[watching ? 'success' : 'debug']('compiled: ' + relative);
                        })
                        .then(() => release(), err => { release(); throw err; })
                        .then(() => subtask.done(), err => { subtask.done(); throw err; });
                } else {
                    const extension = path.extname(relative).substr(1);
                    const plugin = plugins.findByExtension(extension);
                    if (plugin) {
                        const subtask = task.subtask(plugin.extension + ': ' + relative);
                        logger.debug(plugin.extension + ': ' + relative);
                        const destRelative = destFromSrc(relative, plugin);
                        return Promise.resolve(src)
                            .then(src => readFile(src))
                            .then(content => plugin.transform(content, { src, relative, cwd }))
                            .catch(watch && (err => {
                                console.log(toErrorStack(err));

                                return { map: null, code: 'throw new Error("Syntax Error");' };
                            }))
                            .then(result => {
                                if (!result) {
                                    // plugin returned nothing, remove.
                                    return Promise.all(envs.map(env => (
                                        Promise.all([
                                            promiseCallback(done => unlink(dest, done)).catch(() => {}),
                                            promiseCallback(done => unlink(`${dest}.map`, done)).catch(() => {}),
                                        ])
                                    )));
                                }

                                const { code, map } = result;
                                return Promise.all(envs.map(env => {
                                    const dest = path.join(outFn(env), destRelative);
                                    const mapLoc = dest + ".map";
                                    return writeFile(dest, code)
                                      .then(() => Promise.all([
                                          copyChmod(src, dest),
                                          map && writeFile(mapLoc, JSON.stringify(map)),
                                      ]));
                                }))
                            })
                            .then(() => release(), err => { release(); throw err; })
                            .then(() => subtask.done(), err => { subtask.done(); throw err; });
                    } else {
                        const subtask = task.subtask('copy: ' + relative);
                        logger.debug('copy: ' + relative);
                        return Promise.all(envs.map(env => {
                            const out = outFn(env);
                            const dest = path.join(out, relative);
                            return copyFile(src, dest).then(() => copyChmod(src, dest));
                        }))
                        .then(() => release(), err => { release(); throw err; })
                        .then(() => subtask.done(), err => { subtask.done(); throw err; });
                    }
                 }
            });
        }).catch(err => {
            console.log(toErrorStack(err));
            if (!watch) {
                process.exit(1);
            }
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
                    watchLogger.debug('changed: ' + relative);
                    task.subtask('changed: ' + relative);
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
                    watchLogger.debug('unlink: ' + relative);
                    const subtask = task.subtask('delete: ' + relative);
                    if (_lock.isLocked(relative)) watchLogger.debug(relative + ' locked, waiting...');
                    lock(relative).then(release => {
                        return Promise.all(envs.map(env => {
                            const dest = path.join(outFn(env), destFromSrc(relative));

                            return Promise.all([
                                promiseCallback(done => unlink(dest, done)).catch(() => {}),
                                promiseCallback(done => unlink(`${dest}.map`, done)).catch(() => {}),
                            ]);
                        }))
                        .then(() => release())
                        .then(() => watch.emit('changed', filename))
                        .then(() => subtask.done());
                    });
                });
            });
        });
    }

    return Promise.all(srcFiles.map(filename => handle(filename)))
        .then(() => {
            logger.infoSuccessTimeEnd(timeBuildStarted, 'build finished');
            task.succeed();
            if (watch) {
                task = new Task('watch');
                logger.info('watching');
                watching = true;
                logger = watchLogger;
            }
        })
        .catch(err => {
            console.log(err.stack);
            process.exit(1);
        });
};
