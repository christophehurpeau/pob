/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/dot-notation */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
const foo: any = {};
const bar = "bar";

// eslint-disable-next-line @typescript-eslint/prefer-optional-chain
export const a = foo && foo.a && foo.a.b && foo.a.b.c;
// eslint-disable-next-line @typescript-eslint/prefer-optional-chain
export const b = foo && foo["a"] && foo["a"].b && foo["a"].b.c;
// eslint-disable-next-line @typescript-eslint/prefer-optional-chain
export const c = foo && foo.a && foo.a.b && foo.a.b.method && foo.a.b.method();

// With empty objects
// eslint-disable-next-line @typescript-eslint/prefer-optional-chain
export const d = (((foo || {}).a || {}).b || {}).c;
// eslint-disable-next-line @typescript-eslint/prefer-optional-chain
export const e = (((foo || {})["a"] || {}).b || {}).c;

// With negated `or`s
// eslint-disable-next-line @typescript-eslint/prefer-optional-chain
export const f = !foo || !foo.bar;
// eslint-disable-next-line @typescript-eslint/prefer-optional-chain
export const g = !foo || !foo[bar];
// eslint-disable-next-line @typescript-eslint/prefer-optional-chain
export const h = !foo || !foo.bar || !foo.bar.baz || !foo.bar.baz();

// this rule also supports converting chained strict nullish checks:
export const i =
  // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
  foo &&
  foo.a != null &&
  foo.a.b !== null &&
  // eslint-disable-next-line eqeqeq, @typescript-eslint/prefer-optional-chain
  foo.a.b.c != undefined &&
  foo.a.b.c.d !== undefined &&
  foo.a.b.c.d.e;
