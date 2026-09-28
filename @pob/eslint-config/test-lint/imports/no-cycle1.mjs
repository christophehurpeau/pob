// oxlint-disable-next-line import/no-cycle
import { baz } from "./no-cycle2.mjs";

export const foo1 = "foo";
export const baz1 = `${baz}1`;
