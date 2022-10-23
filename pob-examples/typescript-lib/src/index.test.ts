import * as fs from 'fs';
import simpleLib from '.';

describe('index', () => {
  it('should return hello world', () => {
    expect(simpleLib()).toBe('hello world');
  });
});

describe('dist', () => {
  it('should build node14 mjs', () => {
    expect(
      fs.readFileSync(
        './pob-examples/typescript-lib/dist/index-node14.mjs',
        'utf8',
      ),
    ).toMatchInlineSnapshot(`
      "function simpleLib() {
        return 'hello world';
      }

      export { simpleLib as default };
      //# sourceMappingURL=index-node14.mjs.map
      "
    `);
  });
});