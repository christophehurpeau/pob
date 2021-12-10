'use strict';

exports.presetOptions = {
  target: 'node',
  version: '14',
};

exports.actual = `
const p = new Promise((resolve) => setTimeout(resolve, 200));
await p;
`;

exports.expected = `
"use strict";

const p = new Promise(resolve => setTimeout(resolve, 200));
await p;
`;
