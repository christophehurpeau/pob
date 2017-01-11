const { readFileSync } = require('fs');
const clean = require('./clean');
const build = require('./build');
const plugins = require('./plugins');
const babelOptions = require('./babel-options');

const cwd = process.cwd();
const pobrc = (() => {
  try {
    return JSON.parse(readFileSync(`${cwd}/.pobrc.json`));
  } catch (err) {
    return JSON.parse(readFileSync(`${cwd}/.pob.json`));
  }
})();

if (pobrc.plugins) {
  // eslint-disable-next-line global-require, import/no-dynamic-require
  pobrc.plugins.forEach(pluginName => plugins.register(require(`../plugins/${pluginName}`)));
}

if (pobrc.babelPlugins) {
  babelOptions.plugins = pobrc.babelPlugins;
}

exports.clean = clean;
exports.watch = (envs, options) => build(pobrc, cwd, envs, true, options);
exports.build = (envs, options) => build(pobrc, cwd, envs, false, options);

exports.registerPlugin = plugin => plugins.register(plugin);
