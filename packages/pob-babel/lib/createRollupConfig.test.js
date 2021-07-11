import fs from 'fs';
import path from 'path';
import rollup from 'rollup';
import createRollupConfig from './createRollupConfig.js';

describe('fixtures', () => {
  const testsPath = `${path.resolve('test')}/`;
  const tests = fs.readdirSync(testsPath);

  tests.forEach((dirname) => {
    if (dirname === '.eslintignore') return;
    describe(dirname, () => {
      const configs = createRollupConfig({
        cwd: testsPath + dirname,
      });

      configs.forEach((config, index) => {
        test(String(index), async () => {
          // TODO: configure browserslist
          const bundle = await rollup.rollup(config);
          const {
            output: [{ code: actual }],
          } = await bundle.generate({ format: 'esm' });

          expect(actual).toMatchSnapshot();
        });
      });
    });
  });
});
