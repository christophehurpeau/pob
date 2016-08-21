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
    pobrc.plugins.forEach(pluginName => plugins.register(require(`../plugins/${pluginName}`)));
}

if (pobrc.babelPlugins) {
    babelOptions.plugins = pobrc.babelPlugins;
}

exports.clean = clean;
exports.watch = (envs) => build(pobrc, cwd, envs, true);
exports.build = (envs) => build(pobrc, cwd, envs);

exports.registerPlugin = plugin => plugins.register(plugin);
