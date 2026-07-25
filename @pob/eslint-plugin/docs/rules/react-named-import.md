# Importing react should use named imports

💼 This rule is enabled in the ✅ `react` config.

## Fail

```tsx
import React from "react";
import * as React from "react";
```

## Pass

```tsx
import type { ReactNode } from "react";
import { useState } from "react";
```

## Options

None
