'use strict';

exports.presetOptions = {
  target: 'node',
  version: '14',
  module: false,
};

exports.actual = `
const b = await import('./b.js');
console.log(b);
`;

exports.expected = `
const b = await import('./b.js');
console.log(b);
`;
