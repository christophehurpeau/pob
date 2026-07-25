import { join } from "node:path";
import { parser } from "typescript-eslint";
import rule from "./react-named-import.js";
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
ruleTester.run("react-named-import", rule, {
  valid: [
    {
      code: `
      import type { ReactNode } from 'react';

      export const simpleElement: ReactNode = <p>paragraph</p>;
    `,
    },
  ],
  invalid: [
    {
      code: `
      export const simpleElement: React.ReactNode = <p>paragraph</p>;
    `,
      errors: [
        {
          messageId: "namespace",
          line: 2,
          column: 35,
        },
      ],
    },
    {
      code: `
      import { ReactNode } from 'react';
      import * as React from 'react';

      export const a: ReactNode = <p>ok</p>;
      export const b: React.ReactNode = <p>bad</p>;
    `,
      errors: [
        {
          messageId: "namespace",
          line: 3,
          column: 14,
        },
      ],
    },
    {
      code: `
      import React from 'react';

      export const simpleElement: React.ReactNode = <p>paragraph</p>;
    `,
      errors: [
        {
          messageId: "default",
          line: 2,
          column: 14,
        },
      ],
    },
    {
      code: `
      import * as React from 'react';

      export const simpleElement: React.ReactNode = <p>paragraph</p>;
    `,
      errors: [
        {
          messageId: "namespace",
          line: 2,
          column: 14,
        },
      ],
    },
    {
      code: `
      import type * as React from 'react';

      export const simpleElement: React.ReactNode = <p>paragraph</p>;
    `,
      errors: [
        {
          messageId: "namespace",
          line: 2,
          column: 19,
        },
      ],
    },
    {
      code: `
      import * as R from 'react';

      export const simpleElement: R.ReactNode = <p>paragraph</p>;
    `,
      errors: [
        {
          messageId: "namespace",
          line: 2,
          column: 14,
        },
      ],
    },
  ],
});
