# Disallow problematic leaked values from being rendered.

Same as `react/jsx-no-leaked-render` of eslint-plugin-react with its default options, for React >= 18: the left side of `&&` in JSX must be a boolean, or the right side is rendered as `0`, `NaN`, ...

💼 This rule is enabled by `@pob/eslint-config-typescript-react/oxlint/react.json` (oxlint JS plugin).

🔧 This rule is automatically fixable by the `--fix` CLI option: the expression becomes a ternary.

## Fail

```tsx
<div>{count && <Item />}</div>
```

## Pass

```tsx
<div>{count > 0 && <Item />}</div>
<div>{!!count && <Item />}</div>
<div>{count ? <Item /> : null}</div>
```

## Options

None
