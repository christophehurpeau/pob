'use strict';

exports.presetOptions = {
  target: 'node',
  version: '14',
  module: false,
};

exports.actual = `
const p = new Promise((resolve) => setTimeout(resolve, 200));
await p;
`;

exports.expected = `
const p = new Promise(resolve => setTimeout(resolve, 200));
await p;
`;
