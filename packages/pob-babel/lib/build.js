'use strict';

const EventEmitter = require('events');
const clean = require('./clean');
const _build = require('./_build');
const logger = require('./logger').logger;

module.exports = function build(pkg, pobrc, cwd, envs, watch, options) {
  watch = watch || false;
  const envsSet = envs !== undefined;

  if (!envs) {
    envs = pobrc.envs;

    if (envs.includes('node5')) {
      logger.warn('node5 is deprecated.');
      envs = envs.filter(env => env === 'node5');
    }

    envs = envs.reduce((res, env) => {
      res.push(env, `${env}-dev`);
      return res;
    }, []);

    clean(envs);
  }

  if (watch) {
    watch = new EventEmitter();
  }

  return Promise.all([
    _build(pkg, cwd, pobrc.src || 'src', env => `lib-${env}`, envs, watch, options),
    !envsSet &&
      pobrc.examples &&
      _build(pkg, cwd, 'examples/src', () => 'examples/node6', ['node6'], watch, options),
  ]).then(() => watch);
};
