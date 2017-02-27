if (process.env.NODE_ENV === 'production') throw new Error('types are not allowed in production');
module.exports = require('./lib-node7-dev/types');
