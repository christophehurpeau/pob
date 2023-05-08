import * as fs from 'fs';
import simpleLib from '.';

describe('index', () => {
  it('should return hello world', () => {
    expect(simpleLib()).toBe('hello world via node');
  });
});

describe('dist', () => {
  it('should build node18 mjs', () => {
    expect(
      fs.readFileSync(
        // @ts-expect-error -- browser api conflict
        new URL('../dist/index-node18.mjs', import.meta.url),
        'utf8',
      ),
    ).toMatchInlineSnapshot(`
      "function simpleLib() {
        return \`hello world via \${'node'}\`;
      }

      export { simpleLib as default };
      //# sourceMappingURL=index-node18.mjs.map
      "
    `);
  });
});
