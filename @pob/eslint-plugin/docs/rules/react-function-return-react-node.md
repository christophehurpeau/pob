# Return type of react function component should be ReactNode

💼 This rule is enabled in the ✅ `react` config.

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
