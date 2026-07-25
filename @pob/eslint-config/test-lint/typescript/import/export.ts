export const foo = function (): void {
  /* ... */
}; // Multiple exports of name 'foo'.

function bar(): void {}

// foo2 => foo : parsing error
export { bar as foo2 }; // Multiple exports of name 'foo'.
