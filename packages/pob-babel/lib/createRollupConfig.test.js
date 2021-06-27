'use strict';

const fs = require('fs');
const rollup = require('rollup');
const createRollupConfig = require('./createRollupConfig');

describe('fixtures', () => {
  const testsPath = `${__dirname}/../tests/`;
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
