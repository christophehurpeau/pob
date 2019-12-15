'use strict';

const fs = require('fs');
const rollup = require('rollup');
const createRollupConfig = require('./createRollupConfig');

describe('fixtures', () => {
  const testsPath = `${__dirname}/../tests/`;
  const tests = fs.readdirSync(testsPath);

  tests.forEach((dirname) => {
    if (dirname === '.eslintignore') return;
    test(dirname, async () => {
      const configs = createRollupConfig({
        cwd: testsPath + dirname,
      });

      const bundle = await rollup.rollup(configs[0]);
      const {
        output: [{ code: actual }],
      } = await bundle.generate({ format: 'esm' });

      expect(actual).toMatchSnapshot();
    });
  });
});
