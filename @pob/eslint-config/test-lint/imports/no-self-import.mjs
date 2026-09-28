// oxlint-disable-next-line import/no-self-import, import/no-cycle
import { foo as bar } from "./no-self-import.mjs";

export const foo = "foo";
export const baz = `baz${bar}`;
