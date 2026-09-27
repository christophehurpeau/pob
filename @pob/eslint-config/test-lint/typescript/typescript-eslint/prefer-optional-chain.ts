/* oxlint-disable typescript/no-unsafe-call */
/* oxlint-disable typescript/dot-notation */
/* oxlint-disable typescript/no-unsafe-member-access */
/* oxlint-disable typescript/no-unsafe-assignment */
const foo: any = {};
const bar = "bar";

// oxlint-disable-next-line typescript/prefer-optional-chain
export const a = foo && foo.a && foo.a.b && foo.a.b.c;
// oxlint-disable-next-line typescript/prefer-optional-chain
export const b = foo && foo["a"] && foo["a"].b && foo["a"].b.c;
// oxlint-disable-next-line typescript/prefer-optional-chain
export const c = foo && foo.a && foo.a.b && foo.a.b.method && foo.a.b.method();

// With empty objects
// oxlint-disable-next-line typescript/prefer-optional-chain
export const d = (((foo || {}).a || {}).b || {}).c;
// oxlint-disable-next-line typescript/prefer-optional-chain
export const e = (((foo || {})["a"] || {}).b || {}).c;

// With negated `or`s
// oxlint-disable-next-line typescript/prefer-optional-chain
export const f = !foo || !foo.bar;
// oxlint-disable-next-line typescript/prefer-optional-chain
export const g = !foo || !foo[bar];
// oxlint-disable-next-line typescript/prefer-optional-chain
export const h = !foo || !foo.bar || !foo.bar.baz || !foo.bar.baz();

// this rule also supports converting chained strict nullish checks:
export const i =
  // oxlint-disable-next-line typescript/prefer-optional-chain
  foo &&
  foo.a != null &&
  foo.a.b !== null &&
  // eslint-disable-next-line eqeqeq
  foo.a.b.c != undefined &&
  foo.a.b.c.d !== undefined &&
  foo.a.b.c.d.e;
