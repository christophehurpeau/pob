import fs from 'node:fs';
import { transform } from '@babel/core';
import preset from './index.js';

describe('fixtures', () => {
  const tests = fs
    .readdirSync(new URL('./__tests_fixtures__', import.meta.url))
    .filter((name) => name.endsWith('.js'));

  tests.forEach((filename) => {
    test(filename, async () => {
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
      } catch (error) {
        if (!expected && error instanceof SyntaxError && expectedSyntaxError) {
          expect(error.message.split('\n', 2)[0]).toBe(expectedSyntaxError);
          return;
        }
        if (error._babel && error instanceof SyntaxError) {
          console.error(`Unexpected error in test: ${test.name || filename}`);
          console.error(`${error.name}: ${error.message}\n${error.codeFrame}`);
          // eslint-disable-next-line unicorn/no-process-exit
          process.exit(1);
        } else {
          throw error;
        }
      }
    });
  });
});
