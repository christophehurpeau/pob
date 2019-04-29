'use strict';

// node only > 9.3
// const nodeBuiltinModules = require('module').builtinModules;
// eslint-disable-next-line node/no-deprecated-api
const nodeBuiltinModules = Object.keys(process.binding('natives')).filter(
  x => !x.startsWith('internal/')
);

module.exports = (pkgs) => {
  if (!Array.isArray(pkgs)) pkgs = [pkgs];

  const externalModules = nodeBuiltinModules
    .concat.apply(nodeBuiltinModules,pkgs.map(pkg => [].concat(
      Object.keys(pkg.dependencies || {}),
      Object.keys(pkg.peerDependencies || {}),
      Object.keys(pkg.devPeerDependencies || {})
    )));


  return path => {
    if (path.includes('node_modules')) return true;
    if (/^[a-z].*\//.test(path)) {
      path = path.replace(/^([^/]+)\/.*$/, '$1');
    } else if (/^@[a-z].*\//.test(path)) {
      path = path.replace(/^(@[a-z-]+\/[^/]+)\/.*$/, '$1');
    }
    return externalModules.includes(path);
  };
};
