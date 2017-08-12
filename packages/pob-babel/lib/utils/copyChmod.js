const promiseCallback = require('promise-callback-factory').default;
const fs = require('fs');

module.exports = function copyChmod(source, target) {
  return promiseCallback(done => fs.stat(source, done)).then(stat =>
    promiseCallback(done => fs.chmod(target, stat.mode, done))
  );
};
