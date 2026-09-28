// oxlint-disable-next-line import/no-cycle
import { foo1 } from "./no-cycle1.mjs";

export const foo2 = `${foo1}2`;
export const baz = "baz";
