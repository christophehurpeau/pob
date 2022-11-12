export const presetOptions = {
  target: 'node',
  version: '14',
  module: false,
};

export const actual = `
const p = new Promise((resolve) => setTimeout(resolve, 200));
await p;
`;

export const expected = `
const p = new Promise(resolve => setTimeout(resolve, 200));
await p;
`;
