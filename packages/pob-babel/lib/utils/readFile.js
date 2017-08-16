'use strict';

const fs = require('fs');

module.exports = function readFile(target) {
  return new Promise((resolve, reject) => {
    fs.readFile(target, (err, content) => {
      if (err) {
        return reject(new Error(`Failed to read file "${target}": ${err.message || err}`));
      }

      resolve(content);
    });
  });
};
