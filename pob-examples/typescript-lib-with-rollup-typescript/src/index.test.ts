import * as fs from 'node:fs';
import simpleLib from '.';

describe('index', () => {
  it('should return hello world', () => {
    expect(simpleLib()).toBe('hello world via node');
  });
});

describe('dist', () => {
  it('should build node mjs', () => {
    expect(
      fs.readFileSync(
        new URL('../dist/index-node18.mjs', import.meta.url),
        'utf8',
      ),
      // note that inline snapshot does not work with ESM currently
    ).toMatchSnapshot();
  });
});
