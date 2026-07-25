import { join } from "node:path";
import { parser } from "typescript-eslint";
import rule from "./react-function-component-return-react-node.js";
import { RuleTester } from "./test-utils/RuleTester.js";

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      tsconfigRootDir: join(import.meta.dirname, "../fixtures"),
      project: "./tsconfig.json",
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

// @ts-ignore
ruleTester.run("react-function-component-return-react-node", rule, {
  valid: [
    {
      code: `
import type { ReactNode } from 'react';
export function SomeComponent(): ReactNode {
  return <div />;
}
    `,
    },
  ],
  invalid: [
    {
      code: `
import type { ReactElement } from 'react';
export function SomeComponent(): ReactElement {
  return <div />;
}`,
      errors: [
        {
          messageId: "invalidReturnType",
          data: { value: "ReactElement" },
          line: 3,
          column: 34,
          endColumn: 46,
          suggestions: [
            {
              messageId: "replaceReturnType",
              data: { value: "ReactElement" },
              output: `
import type { ReactElement } from 'react';
export function SomeComponent(): ReactNode {
  return <div />;
}`,
            },
          ],
        },
      ],
    },
  ],
});
