declare module "@pob/sort-object" {
  export default function sortObject<T extends object>(
    object: T,
    keys?: readonly string[],
  ): T;
}

declare module "@pob/sort-pkg" {
  export default function sortPkg<T extends object>(pkg: T): T;
}

declare module "@pob/codemods" {
  export function runTransform(
    transformName: string,
    paths: string[],
    options?: Record<string, unknown>,
  ): Promise<unknown>;
}
