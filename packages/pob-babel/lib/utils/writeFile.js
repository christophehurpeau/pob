const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

module.exports = function writeFile(target, content) {
  return new Promise((resolve, reject) => {
    mkdirp(path.dirname(target), () => {
      fs.writeFile(target, content, (err) => {
        if (err) {
          return reject(new Error(`Failed to write file "${target}": ${err.message || err}`));
        }

        resolve();
      });
    });
  });
};
