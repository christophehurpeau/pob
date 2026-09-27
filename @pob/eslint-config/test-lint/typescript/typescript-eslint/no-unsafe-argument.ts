declare function g(x: number): void;
const a: any = 1;
// oxlint-disable-next-line typescript/no-unsafe-argument
g(a);
