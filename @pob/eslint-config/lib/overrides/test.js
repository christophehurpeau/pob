export const testOverrideConfigsWithoutTypescript = [
  {
    name: "@pob/eslint-config/test",

    rules: {
      // allow dev dependencies
      "import-x/no-extraneous-dependencies": [
        "error",
        { devDependencies: true },
      ],
    },
  },
];

export const testOverrideConfigsWithTypescript = [
  ...testOverrideConfigsWithoutTypescript,
  {
    name: "@pob/eslint-config/test-typescript",

    rules: {
      // enable (as any).something in test
      "@typescript-eslint/no-unsafe-member-access": "off",

      // jest.mock in test
      "@typescript-eslint/no-unsafe-return": "off",

      // don't force return type in test
      "@typescript-eslint/explicit-function-return-type": "off",

      // https://github.com/nodejs/node/issues/51292
      "@typescript-eslint/no-floating-promises": [
        "error",
        {
          allowForKnownSafeCalls: [
            {
              from: "package",
              name: ["it", "describe", "test"],
              package: "node:test",
            },
          ],
        },
      ],
    },
  },
];
