# Forbid importing libraries replacing fetch which is now available in native, browser and node.

💼 This rule is enabled by `@pob/eslint-config/oxlint/base.json` (oxlint JS plugin).

## Fail

```ts
import fetch from "node-fetch";

fetch("/api").then(console.log);
```

## Pass

```ts
fetch("/api").then(console.log);
```

## Options

None
