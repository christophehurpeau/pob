export const foo = function () {
  /* ... */
}; // Multiple exports of name 'foo'.

function bar() {}

// foo2 => foo : parsing error
export { bar as foo2 }; // Multiple exports of name 'foo'.
