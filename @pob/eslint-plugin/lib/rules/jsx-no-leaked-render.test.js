import { RuleTester } from "eslint";
import rule from "./jsx-no-leaked-render.js";

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

// @ts-ignore
ruleTester.run("jsx-no-leaked-render", rule, {
  valid: [
    { code: "const a = <div>{count > 0 && <span />}</div>;" },
    { code: "const a = <div>{!!count && <span />}</div>;" },
    { code: "const a = <div>{Boolean(count) && <span />}</div>;" },
    { code: "const a = <div>{!count && <span />}</div>;" },
    { code: "const a = <div>{count ? <span /> : null}</div>;" },
    { code: "const a = <div>{a > 0 && b === 1 && <span />}</div>;" },
    {
      code: "const isOpen = false; const a = <div>{isOpen && <span />}</div>;",
    },
    { code: 'const a = <div>{"" && <span />}</div>;' },
    // not rendered: only JSX expression containers are checked
    { code: "const a = count && <span />;" },
  ],
  invalid: [
    {
      code: "const a = <div>{count && <span />}</div>;",
      output: "const a = <div>{count ? <span /> : null}</div>;",
      errors: [{ messageId: "noPotentialLeakedRender" }],
    },
    {
      code: "const a = <div>{items.length && <span />}</div>;",
      output: "const a = <div>{items.length ? <span /> : null}</div>;",
      errors: [{ messageId: "noPotentialLeakedRender" }],
    },
    {
      code: "const a = <div>{(a || b) && <span />}</div>;",
      output: "const a = <div>{(a || b) ? <span /> : null}</div>;",
      errors: [{ messageId: "noPotentialLeakedRender" }],
    },
    {
      code: "const a = <div>{a > 0 && b && <span />}</div>;",
      output: "const a = <div>{a > 0 && b ? <span /> : null}</div>;",
      errors: [{ messageId: "noPotentialLeakedRender" }],
    },
    {
      code: "const a = <div>{count && (\n  <span />\n)}</div>;",
      output: "const a = <div>{count ? (\n  <span />\n) : null}</div>;",
      errors: [{ messageId: "noPotentialLeakedRender" }],
    },
    {
      code: "const isOpen = 0; const a = <div>{isOpen && <span />}</div>;",
      output:
        "const isOpen = 0; const a = <div>{isOpen ? <span /> : null}</div>;",
      errors: [{ messageId: "noPotentialLeakedRender" }],
    },
  ],
});
