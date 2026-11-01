// type-only specifiers are kept as written in emitted .d.ts files
// oxlint-disable-next-line import/extensions
import type { foo } from "./foo";

export type Foo = typeof foo;
