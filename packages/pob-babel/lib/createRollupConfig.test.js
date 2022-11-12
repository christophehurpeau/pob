import fs from 'fs';
import { fileURLToPath } from 'url';
import { rollup } from 'rollup';
import createRollupConfig from './createRollupConfig.js';

describe('fixtures', () => {
  const testsPath = `${fileURLToPath(new URL('../test', import.meta.url))}/`;
  const tests = fs.readdirSync(testsPath);

  tests.forEach((dirname) => {
    if (dirname === '.eslintrc.json') return;
    describe(dirname, () => {
      const configs = createRollupConfig({
        cwd: testsPath + dirname,
      });

      configs.forEach((config, index) => {
        test(String(index), async () => {
          // TODO: configure browserslist
          const bundle = await rollup(config);
          const {
            output: [{ code: actual }],
          } = await bundle.generate({ format: 'esm' });

          expect(actual).toMatchSnapshot();
        });
      });
    });
  });
});
