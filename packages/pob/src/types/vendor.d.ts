declare module "@pob/codemods" {
  export function runTransform(
    transformName: string,
    paths: string[],
    options?: Record<string, unknown>,
  ): Promise<unknown>;
}
