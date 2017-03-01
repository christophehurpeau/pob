const path = require('path');

if (!process.env.POBREGISTER_ONLY) {
  throw new Error('Missing env variable POBREGISTER_ONLY');
}
const mustStartWithPath = path.resolve(process.env.POBREGISTER_ONLY);

require('babel-register')({
  presets: ['pob', 'latest-node'],
  only: filename => filename.startsWith(mustStartWithPath),
});
