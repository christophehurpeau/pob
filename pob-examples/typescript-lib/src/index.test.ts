import * as fs from 'fs';
import simpleLib from '.';

describe('index', () => {
  it('should return hello world', () => {
    expect(simpleLib()).toBe('hello world via node');
  });
});

describe('dist', () => {
  it('should build node16 mjs', () => {
    expect(
      fs.readFileSync(
        // @ts-expect-error -- browser api conflict
        new URL('../dist/index-node16.mjs', import.meta.url),
        'utf8',
      ),
    ).toMatchInlineSnapshot(`
      "function simpleLib() {
        return \`hello world via \${'node'}\`;
      }

      export { simpleLib as default };
      //# sourceMappingURL=index-node16.mjs.map
      "
    `);
  });
});
