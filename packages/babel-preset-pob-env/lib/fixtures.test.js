'use strict';

const fs = require('fs');
const { transformSync } = require('@babel/core');

describe('fixtures', () => {
  // const presetPath = new URL('..', import.meta.url).pathname;
  const presetPath = require.resolve(`${__dirname}/..`);

  const tests = fs
    // .readdirSync(new URL('__tests_fixtures__', import.meta.url))
    .readdirSync(`${__dirname}/__tests_fixtures__`)
    .filter((name) => name.endsWith('.js'));

  tests.forEach((filename) => {
    // eslint-disable-next-line import/no-dynamic-require
    const testContent = require(`${__dirname}/__tests_fixtures__/${filename}`);
    const expected = testContent.expected && testContent.expected.trim();
    const expectedSyntaxError =
      testContent.expectedSyntaxError && testContent.expectedSyntaxError.trim();

    test(testContent.name || filename, () => {
      try {
        const output = transformSync(testContent.actual, {
          filename: 'file.ts',
          babelrc: false,
          configFile: false,
          presets: [[presetPath, testContent.presetOptions || {}]],
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
