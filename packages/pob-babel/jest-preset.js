const readFileSync = require('fs').readFileSync;
const createOpts = require('./lib/babel-options');

const cwd = process.cwd();
const pobrc = JSON.parse(readFileSync(`${cwd}/.pob.json`));


module.exports = createOpts('jest', pobrc.react);
