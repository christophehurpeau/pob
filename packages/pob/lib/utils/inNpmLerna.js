'use strict';

const inLerna = require('./inLerna');

module.exports = inLerna && inLerna.rootPkg.lerna.npmClient !== 'yarn';
