// oxlint-disable-next-line no-unused-expressions, no-eval
(0, eval("doSomething();"));

export function f(a, b) {
  // oxfmt wraps sequences in parentheses, which the rule allows
  // prettier-ignore
  if (a(), b) return 1; // oxlint-disable-line no-sequences
  return 0;
}
