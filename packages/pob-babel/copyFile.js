const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

module.exports = function copyFile(source, target) {
    return new Promise(function(resolve, reject) {
        mkdirp(path.dirname(target), () => {
            var rd = fs.createReadStream(source);
            rd.on('error', err => reject(new Error(`failed to read file "${source}": ${err.message}`)));
            var wr = fs.createWriteStream(target);
            wr.on('error', err => reject(new Error(`failed to write file "${target}": ${err.message}`)));
            wr.on('finish', resolve);
            wr.on('end', resolve);
            wr.on('close', resolve);
            rd.pipe(wr);
        })
    });
};
