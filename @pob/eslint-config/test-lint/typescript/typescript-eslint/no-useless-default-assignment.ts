interface Options {
  name: string;
}

export function greet({
  // oxlint-disable-next-line typescript/no-useless-default-assignment
  name = "world",
}: Options): string {
  return `hello ${name}`;
}
