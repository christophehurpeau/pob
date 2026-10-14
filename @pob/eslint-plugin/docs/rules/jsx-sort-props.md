# Enforce the order of JSX props.

Same as `react/jsx-sort-props` of eslint-plugin-react with `{ noSortAlphabetically: true, reservedFirst: true, shorthandFirst: true, callbacksLast: true }`: reserved props first (`key`, `ref`, `children`, `dangerouslySetInnerHTML` on DOM elements), then the others, callbacks (`on*`) last, shorthand props first in each group. Names are not sorted, and props are not moved across spread props.

💼 This rule is enabled by `@pob/eslint-config-typescript-react/oxlint/react.json` (oxlint JS plugin).

🔧 This rule is automatically fixable by the `--fix` CLI option.

## Fail

```tsx
<input name="x" key="k" />
<input onChange={handleChange} name="x" />
<input name="x" disabled />
```

## Pass

```tsx
<input key="k" disabled name="x" onChange={handleChange} />
```

## Options

None
