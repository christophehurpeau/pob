declare const foo: string;

// starts with
// eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
console.log(foo[0] === "b");
// eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
console.log(foo.charAt(0) === "b");
// eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
console.log(foo.indexOf("bar") === 0);
// eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
console.log(foo.slice(0, 3) === "bar");
// eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
console.log(foo.substring(0, 3) === "bar");
// eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with, @typescript-eslint/prefer-regexp-exec
console.log(foo.match(/^bar/) != null);
// eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
console.log(/^bar/.test(foo));

// ends with

console.log(foo.at(-1) === "b");
// eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with, unicorn/prefer-at
console.log(foo.charAt(foo.length - 1) === "b");
// eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
console.log(foo.lastIndexOf("bar") === foo.length - 3);
// eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
console.log(foo.slice(-3) === "bar");
// eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
console.log(foo.substring(foo.length - 3) === "bar");
// eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with, @typescript-eslint/prefer-regexp-exec
console.log(foo.match(/bar$/) != null);
// eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
console.log(/bar$/.test(foo));
