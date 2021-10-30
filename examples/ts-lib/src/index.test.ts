import * as fs from 'fs';
import simpleLib from '.';

describe('index', () => {
  it('should return hello world', () => {
    expect(simpleLib()).toBe('hello world');
  });
});

describe('dist', () => {
  it('should build node12 mjs', () => {
    expect(fs.readFileSync('./dist/index-node12.mjs', 'utf-8'))
      .toMatchInlineSnapshot(`
      "function simpleLib() {
        return 'hello world';
      }

      export { simpleLib as default };
      //# sourceMappingURL=index-node12.mjs.map
      "
    `);
  });
});
