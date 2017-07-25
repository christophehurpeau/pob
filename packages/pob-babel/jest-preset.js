const readFileSync = require('fs').readFileSync;
const createOpts = require('./lib/babel-options');

const cwd = process.cwd();
const pkg = JSON.parse(readFileSync(`${cwd}/package.json`));

const useReact =
  (pkg.dependencies && pkg.dependencies.react) ||
  (pkg.devDependencies && pkg.devDependencies.react);
module.exports = createOpts('jest', useReact);
