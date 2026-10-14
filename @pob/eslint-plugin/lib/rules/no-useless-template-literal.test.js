/* oxlint-disable no-template-curly-in-string -- code samples */
import { RuleTester } from "eslint";
import rule from "./no-useless-template-literal.js";

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
});

// @ts-ignore
ruleTester.run("no-useless-template-literal", rule, {
  valid: [
    { code: "const a = 'single';" },
    { code: 'const a = "double";' },
    { code: "const a = `with ${b}`;" },
    { code: "const a = String.raw`tagged`;" },
    { code: "const a = `multi\nline`;" },
    { code: "const a = `multi\\\\\nline`;" },
  ],
  invalid: [
    {
      code: "const a = `plain`;",
      output: 'const a = "plain";',
      errors: [{ messageId: "useless" }],
    },
    {
      code: 'const a = `say "hi"`;',
      output: 'const a = "say \\"hi\\"";',
      errors: [{ messageId: "useless" }],
    },
    {
      code: "const a = `it's`;",
      output: 'const a = "it\'s";',
      errors: [{ messageId: "useless" }],
    },
    {
      code: "const a = `\\`a\\` \\${b} \\n`;",
      output: 'const a = "`a` ${b} \\n";',
      errors: [{ messageId: "useless" }],
    },
    {
      code: "const a = `escaped \\\nline break`;",
      output: 'const a = "escaped \\\nline break";',
      errors: [{ messageId: "useless" }],
    },
    {
      code: "`use strict`;",
      output: null,
      errors: [{ messageId: "useless" }],
    },
  ],
});
