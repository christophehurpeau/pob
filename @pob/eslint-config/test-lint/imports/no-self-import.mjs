// eslint-disable-next-line import-x/no-self-import
import { foo as bar } from "./no-self-import.mjs";

export const foo = "foo";
export const baz = `baz${bar}`;
