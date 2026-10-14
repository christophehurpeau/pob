import { RuleTester } from "eslint";
import rule from "./jsx-sort-props.js";

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

// @ts-ignore
ruleTester.run("jsx-sort-props", rule, {
  valid: [
    { code: "const a = <A key={1} ref={r} b c={1} onClick={f} />;" },
    // names are not sorted
    { code: "const a = <A z={1} a={1} />;" },
    // spread attributes split the groups
    { code: "const a = <A onClick={f} {...props} b={1} />;" },
    // dangerouslySetInnerHTML is only reserved on DOM elements
    { code: "const a = <A b={1} dangerouslySetInnerHTML={html} />;" },
    { code: "const a = <A b onClick onChange={f} />;" },
  ],
  invalid: [
    {
      code: "const a = <A b={1} key={1} />;",
      output: "const a = <A key={1} b={1} />;",
      errors: [{ messageId: "listReservedPropsFirst" }],
    },
    {
      code: "const a = <div b={1} dangerouslySetInnerHTML={html} />;",
      output: "const a = <div dangerouslySetInnerHTML={html} b={1} />;",
      errors: [{ messageId: "listReservedPropsFirst" }],
    },
    {
      code: "const a = <A b={1} c />;",
      output: "const a = <A c b={1} />;",
      errors: [{ messageId: "listShorthandFirst" }],
    },
    {
      code: "const a = <A onClick={f} b={1} />;",
      output: "const a = <A b={1} onClick={f} />;",
      errors: [{ messageId: "listCallbacksLast", column: 14 }],
    },
    {
      code: "const a = <A onClick={f} c={1} b ref={r} {...props} onChange={g} d={1} />;",
      output:
        "const a = <A ref={r} b c={1} onClick={f} {...props} d={1} onChange={g} />;",
      errors: [
        { messageId: "listCallbacksLast" },
        { messageId: "listCallbacksLast" },
      ],
    },
  ],
});
