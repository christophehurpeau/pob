# Forbid importing libraries replacing fetch which is now available in native, browser and node.

💼 This rule is enabled in the ✅ `base` config.

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
