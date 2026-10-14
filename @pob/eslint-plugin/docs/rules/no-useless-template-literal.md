# Disallow template literals without interpolation, line break or tag.

Replaces the deprecated `quotes` rule option `allowTemplateLiterals: false`: oxfmt normalizes string quotes but keeps template literals.

💼 This rule is enabled by `@pob/eslint-config/oxlint/base.json` (oxlint JS plugin).

🔧 This rule is automatically fixable by the `--fix` CLI option.

## Fail

```ts
const a = `plain`;
```

## Pass

```ts
const a = "plain";
const b = `with ${a}`;
const c = String.raw`\tagged`;
const d = `multiple
lines`;
```

## Options

None
