const { readFileSync } = require('fs');
const clean = require('./clean');
const build = require('./build');
const plugins = require('./plugins');

const cwd = process.cwd();
const pobrc = JSON.parse(readFileSync(`${cwd}/.pobrc.json`));

if (pobrc.plugins) {
    pobrc.plugins.forEach(pluginName => plugins.register(require(`../plugins/${pluginName}`)));
}

exports.clean = clean;
exports.watch = (envs) => build(pobrc, cwd, envs, true);
exports.build = (envs) => build(pobrc, cwd, envs);

exports.registerPlugin = plugin => plugins.register(plugin);
