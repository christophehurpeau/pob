# Return type of react function component should be ReactNode

💼 This rule is enabled by `@pob/eslint-config-typescript-react/oxlint/react.json` (oxlint JS plugin).

## Fail

```tsx
function Component(): ReactElement {
  return <div />;
}

function Component(): ReactElement | null {
  return <div />;
}
```

## Pass

```tsx
function Component(): ReactNode {
  return <div />;
}
```

## Options

None
