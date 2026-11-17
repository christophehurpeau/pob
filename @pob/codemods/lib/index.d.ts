/** Runs a transform of lib/transforms on `paths`, like `pob-migrate`. */
export function runTransform(
  transformName: string,
  paths: string[],
  options?: Record<string, unknown>,
): Promise<unknown>;

export function removeUnusedOxlintDirectives(...args: unknown[]): unknown;

export function runRemoveUnusedOxlintDirectives(...args: unknown[]): unknown;
