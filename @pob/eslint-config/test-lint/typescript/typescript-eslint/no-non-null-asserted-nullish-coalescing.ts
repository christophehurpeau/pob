declare const o: { a: string | null };
// eslint-disable-next-line @typescript-eslint/no-non-null-asserted-nullish-coalescing
export const y = o.a! ?? "x";
