export const presetOptions = {
  target: 'node',
  version: '14',
  module: false,
};

export const actual = `
const b = await import('./b.js');
console.log(b);
`;

export const expected = `
const b = await import('./b.js');
console.log(b);
`;
