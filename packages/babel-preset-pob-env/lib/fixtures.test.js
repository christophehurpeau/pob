import fs from 'fs';
import { transform } from '@babel/core';
import preset from '.';

describe('fixtures', () => {
  const tests = fs
    .readdirSync(new URL('./__tests_fixtures__', import.meta.url))
    .filter((name) => name.endsWith('.js'));

  tests.forEach((filename) => {
    test(filename, async () => {
      // eslint-disable-next-line node/no-unsupported-features/es-syntax
      const testContent = await import(`./__tests_fixtures__/${filename}`);
      const expected = testContent.expected && testContent.expected.trim();
      const expectedSyntaxError =
        testContent.expectedSyntaxError &&
        testContent.expectedSyntaxError.trim();

      try {
        const output = await transform(testContent.actual, {
          filename: 'file.ts',
          babelrc: false,
          configFile: false,
          presets: [[preset, testContent.presetOptions || {}]],
        });

        const actual = output.code.trim();

        if (expected) {
          expect(actual).toBe(expected);
        } else if (expectedSyntaxError) {
          expect(actual).toBe(expectedSyntaxError);
        }
      } catch (err) {
        if (!expected && err instanceof SyntaxError && expectedSyntaxError) {
          expect(err.message.split('\n', 2)[0]).toBe(expectedSyntaxError);
          return;
        }
        if (err._babel && err instanceof SyntaxError) {
          console.error(`Unexpected error in test: ${test.name || filename}`);
          console.error(`${err.name}: ${err.message}\n${err.codeFrame}`);
          // eslint-disable-next-line unicorn/no-process-exit
          process.exit(1);
        } else {
          throw err;
        }
      }
    });
  });
});
