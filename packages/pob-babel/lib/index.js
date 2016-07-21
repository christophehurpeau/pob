const { readFileSync } = require('fs');
const clean = require('./clean');
const build = require('./build');

const cwd = process.cwd();
const pobrc = JSON.parse(readFileSync(`${cwd}/.pobrc.json`));

exports.clean = clean;
exports.watch = (envs) => build(pobrc, cwd, envs, true);
exports.build = (envs) => build(pobrc, cwd, envs);
