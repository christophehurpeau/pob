import { RuleTester } from "eslint";
import rule from "./forbid-non-native-node-imports.js";

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
  },
});

// @ts-ignore
ruleTester.run("forbid-non-native-node-imports", rule, {
  valid: [
    {
      code: `
      import { styleText } from 'node:util';
    `,
    },
  ],
  invalid: [
    {
      code: `
      import chalk from 'chalk';
      chalk.red('Hello, world!');
    `,
      errors: [
        {
          messageId: "forbidden",
          data: { value: "chalk", nativeImport: "styleText from node:util" },
        },
      ],
    },
  ],
});
